#!/usr/bin/env python3
"""
Azure OpenAI Chain of Thought API
A simple FastAPI application that provides streaming chain of thought reasoning.
"""

import sys
import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import json
import asyncio
from datetime import datetime
import time

# Add parent directory to path to import our OOP classes
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

try:
    from azure_ai_functions import AzureOpenAIApp, AzureOpenAIConfig
except ImportError as e:
    print(f"Error importing azure_ai_test: {e}")
    print(f"Current sys.path: {sys.path}")
    print(f"Parent directory: {parent_dir}")
    raise


# Pydantic models for request/response
class ChatRequest(BaseModel):
    query: str = Field(..., description="The user's question or query")
    system_prompt: Optional[str] = Field(
        default="You are a helpful assistant. Show your thinking process step by step.",
        description="Optional system prompt to guide the AI's behavior"
    )


class ChatResponse(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    reasoning: str = Field(..., description="The AI's chain of thought reasoning")
    answer: str = Field(..., description="The final answer from the AI")
    compliance_log: Optional[str] = Field(None, description="Path to compliance log file")
    timestamp: str = Field(..., description="ISO timestamp of the response")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional error details")


# Initialize FastAPI app
app = FastAPI(
    title="Azure OpenAI Chain of Thought API",
    description="A simple API for streaming chain of thought reasoning with Azure OpenAI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Azure OpenAI Chain of Thought API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "chat": "/chat",
            "docs": "/docs",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with configuration status."""
    try:
        config = AzureOpenAIConfig()
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "config": {
                "model_deployment": config.model_deployment,
                "api_version": config.api_version,
                "compliance_logging": config.enable_compliance_logging
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Configuration error: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat request with chain of thought reasoning.
    
    This endpoint:
    - Takes a user query and optional system prompt
    - Returns the AI's reasoning process and final answer
    - Maintains compliance logging
    - Provides real-time streaming of the reasoning process
    """
    try:
        # Initialize the Azure OpenAI app
        app_instance = AzureOpenAIApp()
        
        # Process the request
        result = app_instance.run(
            user_query=request.query,
            system_prompt=request.system_prompt
        )
        
        # Prepare response
        response = ChatResponse(
            session_id=app_instance.session_id,
            reasoning=result["reasoning"],
            answer=result["answer"],
            compliance_log=app_instance.logger.log_file,
            timestamp=datetime.now().isoformat()
        )
        
        return response
        
    except ValueError as e:
        # Configuration errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # General errors
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream a chat response with real-time chain of thought reasoning.
    
    This endpoint provides a streaming response where you can see the AI's
    reasoning process in real-time as it happens.
    """
    
    async def generate_stream():
        try:
            # Initialize the Azure OpenAI app
            app_instance = AzureOpenAIApp()
            
            # Log session start
            app_instance.logger.log_session_start(
                model=app_instance.config.model_deployment,
                api_version=app_instance.config.api_version,
                endpoint=app_instance.config.endpoint,
                user_query=request.query
            )
            
            # Prepare messages
            messages = [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.query}
            ]
            
            # Create streaming response
            response_stream = app_instance.client.create_streaming_response(messages)
            
            # Stream the response
            reasoning_text = ""
            answer_text = ""
            
            print(f"Starting to stream Azure OpenAI response at {time.time()}")
            event_count = 0
            
            # Force buffering to be minimal by processing immediately
            try:
                for event in response_stream:
                    event_count += 1
                    print(f"Processing event {event_count}: {event.type} at {time.time()}")
                    
                    # Log every event for compliance
                    app_instance.logger.log_event(
                        event_type=event.type,
                        content=getattr(event, 'delta', ''),
                        sequence_number=getattr(event, 'sequence_number', None)
                    )
                    
                    # Process different event types
                    if event.type == "response.reasoning_summary_text.delta":
                        reasoning_text += event.delta
                        chunk = f"data: {json.dumps({'type': 'reasoning', 'content': event.delta})}\n\n"
                        print(f"Yielding reasoning chunk: {len(chunk)} chars")
                        yield chunk
                        # Small delay to ensure streaming behavior
                        await asyncio.sleep(0.001)
                    elif event.type == "response.reasoning_summary_text.done":
                        chunk = f"data: {json.dumps({'type': 'reasoning_done'})}\n\n"
                        print(f"Yielding reasoning_done")
                        yield chunk
                    elif event.type == "response.output_text.delta":
                        answer_text += event.delta
                        chunk = f"data: {json.dumps({'type': 'answer', 'content': event.delta})}\n\n"
                        print(f"Yielding answer chunk: {len(chunk)} chars")
                        yield chunk
                        # Small delay to ensure streaming behavior
                        await asyncio.sleep(0.001)
                    elif event.type == "response.completed":
                        # Log session completion
                        app_instance.logger.log_session_complete(
                            reasoning_text=reasoning_text,
                            answer_text=answer_text
                        )
                        
                        # Send final summary
                        chunk = f"data: {json.dumps({'type': 'complete', 'session_id': app_instance.session_id})}\n\n"
                        print(f"Yielding complete")
                        yield chunk
                        break
                    elif event.type == "error":
                        chunk = f"data: {json.dumps({'type': 'error', 'message': event.message})}\n\n"
                        print(f"Yielding error")
                        yield chunk
                        break
            except Exception as inner_e:
                print(f"Error in streaming loop: {inner_e}")
                yield f"data: {json.dumps({'type': 'error', 'message': str(inner_e)})}\n\n"
                    
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

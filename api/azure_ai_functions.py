import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, Generator
from openai import AzureOpenAI
from openai.types.chat import ChatCompletionChunk
import dotenv


class AzureOpenAIConfig:
    """Configuration manager for Azure OpenAI settings."""
    
    def __init__(self):
        dotenv.load_dotenv()
        self._validate_environment()
    
    def _validate_environment(self) -> None:
        """Validate that all required environment variables are set."""
        required_vars = {
            "AZURE_OPENAI_API_KEY": os.getenv("AZURE_OPENAI_API_KEY"),
            "AZURE_OPENAI_ENDPOINT": os.getenv("AZURE_OPENAI_ENDPOINT")
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    @property
    def api_key(self) -> str:
        return os.getenv("AZURE_OPENAI_API_KEY")
    
    @property
    def endpoint(self) -> str:
        return os.getenv("AZURE_OPENAI_ENDPOINT")
    
    @property
    def model_deployment(self) -> str:
        return os.getenv("AZURE_OPENAI_MODEL_DEPLOYMENT", "gpt-5-nano")
    
    @property
    def api_version(self) -> str:
        return os.getenv("AZURE_OPENAI_API_VERSION", "2025-03-01-preview")
    
    @property
    def compliance_log_dir(self) -> str:
        return os.getenv("COMPLIANCE_LOG_DIR", "compliance_logs")
    
    @property
    def enable_compliance_logging(self) -> bool:
        return os.getenv("ENABLE_COMPLIANCE_LOGGING", "true").lower() == "true"


class ComplianceLogger:
    """Handles compliance logging for audit trails."""
    
    def __init__(self, config: AzureOpenAIConfig, session_id: str):
        self.config = config
        self.session_id = session_id
        self.log_file = None
        
        if config.enable_compliance_logging:
            os.makedirs(config.compliance_log_dir, exist_ok=True)
            self.log_file = f"{config.compliance_log_dir}/{session_id}.jsonl"
    
    def log_session_start(self, model: str, api_version: str, endpoint: str, user_query: str) -> None:
        """Log the start of a new session."""
        if not self.log_file:
            return
            
        with open(self.log_file, "w") as f:
            f.write(json.dumps({
                "session_id": self.session_id,
                "start_time": datetime.now().isoformat(),
                "model": model,
                "api_version": api_version,
                "endpoint": endpoint,
                "user_query": user_query,
                "event_type": "session_start"
            }) + "\n")
    
    def log_event(self, event_type: str, content: str = "", sequence_number: Optional[int] = None) -> None:
        """Log a streaming event."""
        if not self.log_file:
            return
            
        with open(self.log_file, "a") as f:
            f.write(json.dumps({
                "timestamp": datetime.now().isoformat(),
                "event_type": event_type,
                "session_id": self.session_id,
                "content": content,
                "sequence_number": sequence_number
            }) + "\n")
    
    def log_session_complete(self, reasoning_text: str, answer_text: str) -> None:
        """Log the completion of a session."""
        if not self.log_file:
            return
            
        with open(self.log_file, "a") as f:
            f.write(json.dumps({
                "timestamp": datetime.now().isoformat(),
                "event_type": "session_complete",
                "session_id": self.session_id,
                "reasoning_word_count": len(reasoning_text.split()),
                "answer_word_count": len(answer_text.split()),
                "total_reasoning_text": reasoning_text,
                "total_answer_text": answer_text
            }) + "\n")


class AzureOpenAIStreamingClient:
    """Main client for Azure OpenAI streaming with reasoning capabilities."""
    
    def __init__(self, config: AzureOpenAIConfig):
        self.config = config
        self.client = AzureOpenAI(
            api_version=config.api_version,
            azure_endpoint=config.endpoint,
            api_key=config.api_key,
        )
    
    def create_streaming_response(
        self, 
        messages: list, 
        model: Optional[str] = None,
        reasoning_effort: str = "medium",
        reasoning_summary: str = "detailed"
    ) -> Generator[Any, None, None]:
        print(f"Creating streaming response with reasoning effort: {reasoning_effort} and reasoning summary: {reasoning_summary}")
        """Create a streaming response with reasoning capabilities."""
        return self.client.responses.create(
            input=messages,
            model=model or self.config.model_deployment,
            reasoning={
                "effort": reasoning_effort,
                "summary": reasoning_summary
            },
            stream=True
        )


class StreamingResponseProcessor:
    """Processes streaming responses and handles real-time output."""
    
    def __init__(self, logger: ComplianceLogger):
        self.logger = logger
        self.reasoning_text = ""
        self.answer_text = ""
    
    def process_stream(self, response_stream: Generator[Any, None, None]) -> Dict[str, str]:
        """Process the streaming response and return the collected text."""
        print("🧠 Streaming Chain of Thought Reasoning...\n")
        
        for event in response_stream:
            # Log every event for compliance
            self.logger.log_event(
                event_type=event.type,
                content=getattr(event, 'delta', ''),
                sequence_number=getattr(event, 'sequence_number', None)
            )
            
            # Process different event types
            if event.type == "response.reasoning_summary_text.delta":
                self.reasoning_text += event.delta
                print("🧠", event.delta, end="", flush=True)
            elif event.type == "response.reasoning_summary_text.done":
                print("\n\n📝 Final Answer:")
            elif event.type == "response.output_text.delta":
                self.answer_text += event.delta
                print(event.delta, end="", flush=True)
            elif event.type == "response.completed":
                print("\n\n✅ Stream Complete!")
                break
            elif event.type == "response.in_progress":
                print("⏳ Processing...", end="", flush=True)
            elif event.type == "error":
                print(f"\n❌ Error: {event.message}")
                break
        
        return {
            "reasoning": self.reasoning_text,
            "answer": self.answer_text
        }
    
    def print_summary(self, log_file: Optional[str] = None) -> None:
        """Print a summary of the streaming session."""
        print(f"\n\n📊 Summary:")
        print(f"🧠 Reasoning tokens: {len(self.reasoning_text.split())} words")
        print(f"📝 Answer tokens: {len(self.answer_text.split())} words")
        if log_file:
            print(f"📋 Compliance log: {log_file}")
        else:
            print("📋 Compliance logging: Disabled")


class AzureOpenAIApp:
    """Main application class that orchestrates the entire process."""
    
    def __init__(self):
        self.config = AzureOpenAIConfig()
        self.client = AzureOpenAIStreamingClient(self.config)
        self.session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.logger = ComplianceLogger(self.config, self.session_id)
        self.processor = StreamingResponseProcessor(self.logger)
    
    def run(self, user_query: str, system_prompt: str = "You are a helpful assistant. Show your thinking process step by step.") -> Dict[str, str]:
        """Run the complete streaming session."""
        try:
            # Log session start
            self.logger.log_session_start(
                model=self.config.model_deployment,
                api_version=self.config.api_version,
                endpoint=self.config.endpoint,
                user_query=user_query
            )
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]
            
            # Create streaming response
            response_stream = self.client.create_streaming_response(messages)
            
            # Process the stream
            result = self.processor.process_stream(response_stream)
            
            # Log session completion
            self.logger.log_session_complete(
                reasoning_text=result["reasoning"],
                answer_text=result["answer"]
            )
            
            # Print summary
            self.processor.print_summary(self.logger.log_file)
            
            return result
            
        except Exception as e:
            print(f"\n❌ Error during streaming: {str(e)}")
            raise


def main():
    """Main entry point for the application."""
    try:
        app = AzureOpenAIApp()
        result = app.run("I am going to Paris, what should I see? Return 1 location")
        return result
    except Exception as e:
        print(f"Application failed: {str(e)}")
        return None


if __name__ == "__main__":
    main() 
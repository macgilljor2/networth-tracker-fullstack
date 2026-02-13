"""
logger.py - A configurable logging module for Python applications

This module provides a convenient way to set up logging across different modules
in a Python application with consistent formatting and configuration.
"""

import logging
import os
import sys
from datetime import datetime
from typing import Optional, Union


class LoggerFactory:
    """
    Factory class to create and configure loggers for different modules.
    """
    
    # Default format for log messages
    DEFAULT_FORMAT = '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
    
    # Format for detailed logging (includes file and line number)
    DETAILED_FORMAT = '%(asctime)s | %(levelname)-8s | %(name)s | %(filename)s:%(lineno)d | %(message)s'
    
    # Date format
    DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
    
    # Store configured loggers to avoid duplicate configuration
    _loggers = {}
    
    @classmethod
    def get_logger(cls, 
                   name: str, 
                   level: Union[int, str] = logging.DEBUG,
                   format_str: Optional[str] = None,
                   date_format: Optional[str] = None,
                   stream_handler: bool = True,
                   file_handler: Optional[str] = None,
                   detailed: bool = False,
                   propagate: bool = False) -> logging.Logger:
        """
        Get or create a logger with the specified configuration.
        
        Args:
            name: The name of the logger, typically the module name (__name__)
            level: The logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            format_str: Custom format string for log messages
            date_format: Custom date format for timestamps
            stream_handler: Whether to add a stream handler (logs to console)
            file_handler: Path to log file (if None, no file handler is added)
            detailed: If True, use detailed format including file/line info
            propagate: Whether the logger should propagate to parent loggers
        
        Returns:
            A configured logging.Logger instance
        """
        # Return existing logger if already configured
        if name in cls._loggers:
            return cls._loggers[name]
        
        # Create new logger
        logger = logging.getLogger(name)
        
        # Set level
        if isinstance(level, str):
            level = getattr(logging, level.upper())
        logger.setLevel(level)
        
        # Set propagation behavior
        logger.propagate = propagate
        
        # Determine format string
        if format_str is None:
            format_str = cls.DETAILED_FORMAT if detailed else cls.DEFAULT_FORMAT
        
        # Determine date format
        if date_format is None:
            date_format = cls.DATE_FORMAT
        
        # Create formatter
        formatter = logging.Formatter(format_str, date_format)
        
        # Add stream handler if requested
        if stream_handler and not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
            stream_handler = logging.StreamHandler(sys.stdout)
            stream_handler.setFormatter(formatter)
            logger.addHandler(stream_handler)
        
        # Add file handler if requested
        if file_handler and not any(isinstance(h, logging.FileHandler) for h in logger.handlers):
            # Create directory if it doesn't exist
            log_dir = os.path.dirname(file_handler)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir)
                
            file_handler_obj = logging.FileHandler(file_handler)
            file_handler_obj.setFormatter(formatter)
            logger.addHandler(file_handler_obj)
        
        # Store logger for reuse
        cls._loggers[name] = logger
        
        return logger


def setup_root_logger(level: Union[int, str] = logging.INFO,
                     format_str: Optional[str] = None,
                     log_file: Optional[str] = None) -> logging.Logger:
    """
    Configure the root logger.
    
    Args:
        level: The logging level
        format_str: Custom format string
        log_file: Path to log file
        
    Returns:
        The configured root logger
    """
    # Clear existing handlers from root logger
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    return LoggerFactory.get_logger(
        name="root",
        level=level,
        format_str=format_str,
        stream_handler=True,
        file_handler=log_file
    )


def get_logger(module_name: str = None, **kwargs) -> logging.Logger:
    """
    Convenience function to get a logger for a module.
    If module_name is None, uses the caller's module name.
    
    Args:
        module_name: Name for the logger (typically the module name)
        **kwargs: Additional configuration to pass to LoggerFactory.get_logger
        
    Returns:
        A configured logging.Logger instance
    """
    if module_name is None:
        # Get the caller's module name
        import inspect
        frame = inspect.stack()[1]
        module = inspect.getmodule(frame[0])
        module_name = module.__name__
    
    return LoggerFactory.get_logger(name=module_name, **kwargs)
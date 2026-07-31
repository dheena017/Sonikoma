class DomainException(Exception):
    pass

class ResourceNotFoundException(DomainException):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class ProcessingException(DomainException):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

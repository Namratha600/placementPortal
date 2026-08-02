def generate_college_email(register_number: str) -> str:
    """
    Converts a register number into the official college email.
    Example: '22IT001' -> '22it001@svecw.edu.in'

    Kept as a single tiny function (rather than inline in the router) so
    the college domain is defined in exactly one place. If the domain
    ever changes, this is the only line that needs updating.
    """
    return f"{register_number.lower()}@svecw.edu.in"
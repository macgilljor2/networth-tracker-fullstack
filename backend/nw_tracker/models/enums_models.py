from typing import List, Dict
from pydantic import BaseModel, Field
from nw_tracker.models.models import AccountType, Currency, Theme


class EnumValue(BaseModel):
    """Single enum value with label and value."""
    value: str
    label: str


class EnumResponse(BaseModel):
    """Response model for a single enum type."""
    name: str
    values: List[EnumValue]


class AllEnumsResponse(BaseModel):
    """Response model containing all application enums."""
    account_types: List[EnumValue]
    currencies: List[EnumValue]
    themes: List[EnumValue]


# Custom labels for better frontend display
ENUM_LABELS: Dict[str, Dict[str, str]] = {
    "Currency": {
        "GBP": "British Pound (£)",
        "USD": "US Dollar ($)",
        "EUR": "Euro (€)"
    }
}


def get_enum_values(enum_class) -> List[EnumValue]:
    """Convert an enum class to list of EnumValue objects with nice labels."""
    enum_name = enum_class.__name__

    return [
        EnumValue(
            value=item.value,
            label=ENUM_LABELS.get(enum_name, {}).get(item.value, item.value.capitalize())
        )
        for item in enum_class
    ]

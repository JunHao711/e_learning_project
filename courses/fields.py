from django.db import models
from django.db.models import Max

class OrderField(models.PositiveIntegerField):
    """
    A custom field that automatically assigns an order value based on 
    the maximum existing value within a specific subset of objects.
    """
    def __init__(self, for_fields=None, *args, **kwargs):
        self.for_fields = for_fields
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        """
        Calculates the order value before saving the object to the database.
        """
        if getattr(model_instance, self.attname) is None:
            # If no order is specified, calculate it automatically
            qs = self.model.objects.all()
            if self.for_fields:
                # Filter by related fields (e.g., all modules within the same course)
                query = {field: getattr(model_instance, field) for field in self.for_fields}
                qs = qs.filter(**query)
            
            # use Max() aggregation instead of fetching the object.
            last_item = qs.aggregate(max_value=Max(self.attname))
            
            if last_item['max_value'] is not None:
                value = last_item['max_value'] + 1
            else:
                # If it's the first item, start at 0
                value = 0
            
            # Assign the calculated value to the instance
            setattr(model_instance, self.attname, value)
            return value
        else:
            return super().pre_save(model_instance, add)
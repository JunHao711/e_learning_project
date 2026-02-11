from django.db import models
from django.core.exceptions import ObjectDoesNotExist

class OrderField(models.PositiveIntegerField):
    def __init__(self, for_fields=None, *args, **kwargs):
        self.for_fields = for_fields
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        """
        在保存之前计算 order 的值
        """
        if getattr(model_instance, self.attname) is None:
            # 如果没有指定 order 值，就自动计算
            try:
                qs = self.model.objects.all()
                if self.for_fields:
                    # 比如: 筛选同一个 Course 下的所有 Module
                    query = {field: getattr(model_instance, field) for field in self.for_fields}
                    qs = qs.filter(**query)
                
                # 获取当前最大的 order 值
                last_item = qs.latest(self.attname)
                value = last_item.order + 1
            except ObjectDoesNotExist:
                # 如果是第一个，就设为 0
                value = 0
            
            # 赋值给当前对象
            setattr(model_instance, self.attname, value)
            return value
        else:
            return super().pre_save(model_instance, add)
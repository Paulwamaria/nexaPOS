from .models import AuditLog


def create_audit_log(
    *,
    user=None,
    branch=None,
    action,
    entity_type,
    entity_id="",
    description="",
    metadata=None,
    ip_address=None,
):
    return AuditLog.objects.create(
        user=user,
        branch=branch,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else "",
        description=description,
        metadata=metadata or {},
        ip_address=ip_address,
    )

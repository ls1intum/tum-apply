package de.tum.cit.aet.core.security;

import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;

public class CustomSecurityExpressionRoot extends SecurityExpressionRoot implements MethodSecurityExpressionOperations {

    private final CurrentUserService currentUserService;
    private Object filterObject;
    private Object returnObject;
    private Object thisObject;

    public CustomSecurityExpressionRoot(Authentication authentication, CurrentUserService currentUserService) {
        super(authentication);
        this.currentUserService = currentUserService;
    }

    public boolean hasGroupRole(String roleName, UUID groupId) {
        User user = currentUserService.getCurrentUser();
        return user
            .getResearchGroupRoles()
            .stream()
            .anyMatch(r -> r.getResearchGroup().getId().equals(groupId) && r.getRole().name().equals(roleName));
    }

    @Override
    public Object getFilterObject() {
        return filterObject;
    }

    @Override
    public void setFilterObject(Object o) {
        this.filterObject = o;
    }

    @Override
    public Object getReturnObject() {
        return returnObject;
    }

    @Override
    public void setReturnObject(Object o) {
        this.returnObject = o;
    }

    @Override
    public Object getThis() {
        return thisObject;
    }

    public void setThis(Object target) {
        this.thisObject = target;
    }
}

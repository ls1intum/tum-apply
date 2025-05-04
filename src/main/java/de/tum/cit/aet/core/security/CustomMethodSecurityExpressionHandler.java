package de.tum.cit.aet.core.security;

import org.aopalliance.intercept.MethodInvocation;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;

public class CustomMethodSecurityExpressionHandler extends DefaultMethodSecurityExpressionHandler {

    private final CurrentUserService currentUserService;

    public CustomMethodSecurityExpressionHandler(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @Override
    protected MethodSecurityExpressionOperations createSecurityExpressionRoot(Authentication authentication, MethodInvocation invocation) {
        var root = new CustomSecurityExpressionRoot(authentication, currentUserService);
        root.setThis(invocation.getThis());
        return root;
    }
}

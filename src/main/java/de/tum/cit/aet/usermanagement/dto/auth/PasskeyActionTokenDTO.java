package de.tum.cit.aet.usermanagement.dto.auth;

/**
 * Short-lived browser bridge token for direct Keycloak passkey operations.
 *
 * @param realm       Keycloak realm that issued the token
 * @param clientId    Keycloak client that owns the token and must be used in the passkey endpoint path
 * @param accessToken bearer token to use for the passkey save request
 * @param expiresIn   remaining token lifetime in seconds
 */
public record PasskeyActionTokenDTO(String realm, String clientId, String accessToken, int expiresIn) {}

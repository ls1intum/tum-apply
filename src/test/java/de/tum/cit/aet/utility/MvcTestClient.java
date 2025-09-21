package de.tum.cit.aet.utility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Thin HTTP client for MVC.
 * - Central place for common request setup (Accept, JSON content).
 * - Keeps request-building logic away from individual tests.
 *
 * Tip: Use the "with(...)" helper to attach security to all requests from this client,
 * for example a JWT RequestPostProcessor.
 */
public class MvcTestClient {

    // --- Framework wiring -----------------------------------------------------------
    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;

    public MvcTestClient(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    // --- Defaults --------------------------------------------------------------------------------
    private MediaType defaultAccept = MediaType.APPLICATION_JSON;

    /**
     * RequestPostProcessors applied to every request from this client.
     * Typical use is authentication, e.g. a JWT post-processor.
     */
    private final List<RequestPostProcessor> defaultPostProcessors = new ArrayList<>();

    /**
     * Sets the default Accept header used by all requests.
     * JSON is used by default.
     */
    public MvcTestClient withDefaultAccept(MediaType accept) {
        this.defaultAccept = accept;
        return this;
    }

    /**
     * Replaces the set of RequestPostProcessors applied to every request.
     * Example usage: api.with(jwt(...)).getAndReadOk(...)
     */
    public MvcTestClient with(RequestPostProcessor... rpps) {
        this.defaultPostProcessors.clear();
        if (rpps != null && rpps.length > 0) {
            this.defaultPostProcessors.addAll(Arrays.asList(rpps));
        }
        return this;
    }

    /**
     * Removes all default RequestPostProcessors.
     * After calling this, subsequent requests will not carry previously set processors.
     */
    public MvcTestClient withoutPostProcessors() {
        this.defaultPostProcessors.clear();
        return this;
    }

    // --- request + assert 200 OK + JSON deserialization -----------------------
    // Use these in tests by default.

    /**
     * Performs a GET and asserts 200 OK, then deserializes the body to the given class.
     * Query parameters and optional Accept overrides are supported.
     * If type is Void, only the assertion is performed.
     */
    public <T> T getAndReadOk(String url, Map<String, String> params, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            getOk(url, params, accepts);
            return null;
        }
        return read(getOk(url, params, accepts), type);
    }

    /**
     * Performs a GET and asserts 200 OK, then deserializes the body using a TypeReference.
     * Useful for generic types like PageResponse<Foo>.
     */
    public <T> T getAndReadOk(String url, Map<String, String> params, TypeReference<T> typeRef, MediaType... accepts) {
        return read(getOk(url, params, accepts), typeRef);
    }

    /**
     * Performs a POST with a JSON body and asserts 200 OK, then deserializes to the given class.
     * If type is Void, only the assertion is performed.
     */
    public <T> T postAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            postOk(url, body, accepts);
            return null;
        }
        return read(postOk(url, body, accepts), type);
    }

    /**
     * Performs a POST with a JSON body and asserts 200 OK, then deserializes using a TypeReference.
     */
    public <T> T postAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(postOk(url, body, accepts), typeRef);
    }

    /**
     * Performs a PUT with a JSON body and asserts 200 OK, then deserializes to the given class.
     * If type is Void, only the assertion is performed.
     */
    public <T> T putAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            putOk(url, body, accepts);
            return null;
        }
        return read(putOk(url, body, accepts), type);
    }

    /**
     * Performs a PUT with a JSON body and asserts 200 OK, then deserializes using a TypeReference.
     */
    public <T> T putAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(putOk(url, body, accepts), typeRef);
    }

    /**
     * Performs a DELETE and asserts 204 No Content, then optionally deserializes if a body is returned.
     * If type is Void, only the assertion is performed.
     */
    public <T> T deleteAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            deleteOk(url, body, accepts);
            return null;
        }
        return read(deleteOk(url, body, accepts), type);
    }

    /**
     * Performs a DELETE and asserts 204 No Content, then deserializes using a TypeReference if present.
     */
    public <T> T deleteAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(deleteOk(url, body, accepts), typeRef);
    }

    // --- No-throws convenience (assert 200 OK inside) -------------------------------------------

    /**
     * Low-level GET that asserts 200 OK and returns the MvcResult.
     * Wraps checked exceptions as AssertionError for cleaner tests.
     */
    private MvcResult getOk(String url, Map<String, String> params, MediaType... accepts) {
        try {
            return get(url, params, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("GET " + url + " failed", e);
        }
    }

    /**
     * Low-level POST that asserts 200 OK and returns the MvcResult.
     */
    private MvcResult postOk(String url, Object body, MediaType... accepts) {
        try {
            return postJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("POST " + url + " failed", e);
        }
    }

    /**
     * Low-level PUT that asserts 200 OK and returns the MvcResult.
     */
    private MvcResult putOk(String url, Object body, MediaType... accepts) {
        try {
            return putJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("PUT " + url + " failed", e);
        }
    }

    /**
     * Low-level DELETE that asserts 204 No Content and returns the MvcResult.
     */
    private MvcResult deleteOk(String url, Object body, MediaType... accepts) {
        try {
            return deleteJson(url, body, accepts).andExpect(status().isNoContent()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("DELETE " + url + " failed", e);
        }
    }

    // --- HTTP performers (low-level, throw checked Exception) -----------------------------------

    /**
     * Builds and performs a GET applying default Accept and any configured RequestPostProcessors.
     */
    private ResultActions get(String url, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyDefaults(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts)
        );
    }

    /**
     * Builds and performs a GET with query parameters, applying defaults and processors.
     */
    private ResultActions get(String url, Map<String, String> params, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder rb =
            applyDefaults(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts);
        if (params != null) params.forEach(rb::param);
        return mockMvc.perform(rb);
    }

    /**
     * Builds and performs a POST with a JSON body, applying defaults and processors.
     */
    private ResultActions postJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyDefaults(post(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    /**
     * Builds and performs a PUT with a JSON body, applying defaults and processors.
     */
    private ResultActions putJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyDefaults(put(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    /**
     * Builds and performs a DELETE, optionally with a JSON body, applying defaults and processors.
     */
    private ResultActions deleteJson(String url, Object body, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder rb = applyDefaults(delete(url), accepts)
            .contentType(MediaType.APPLICATION_JSON);
        if (body != null) rb.content(objectMapper.writeValueAsString(body));
        return mockMvc.perform(rb);
    }

    // --- Shortcuts that parse JSON bodies --------------------------------------------------------

    /**
     * Reads and deserializes the response body into a concrete class.
     */
    private <T> T read(MvcResult result, Class<T> type) {
        try {
            return objectMapper.readValue(body(result), type);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body as " + type.getSimpleName(), e);
        }
    }

    /**
     * Reads and deserializes the response body using a TypeReference.
     */
    private <T> T read(MvcResult result, TypeReference<T> typeRef) {
        try {
            return objectMapper.readValue(body(result), typeRef);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body via TypeReference", e);
        }
    }

    // --- Internal helpers ------------------------------------------------------------------------

    /**
     * Applies the default Accept header and all configured RequestPostProcessors.
     * This is where authentication processors are attached.
     */
    private MockHttpServletRequestBuilder applyDefaults(MockHttpServletRequestBuilder rb, MediaType... accepts) {
        rb = (accepts != null && accepts.length > 0) ? rb.accept(accepts) : rb.accept(defaultAccept);
        for (RequestPostProcessor rpp : defaultPostProcessors) {
            rb.with(rpp);
        }
        return rb;
    }

    // --- Misc helpers ----------------------------------------------------------------------------

    /**
     * Returns the response body as a string.
     */
    private static String body(MvcResult result) throws Exception {
        MockHttpServletResponse resp = result.getResponse();
        return resp.getContentAsString();
    }
}

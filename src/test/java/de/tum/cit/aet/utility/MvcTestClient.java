package de.tum.cit.aet.utility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Thin HTTP client for MVC.
 * - Central place for common request setup (Accept, JSON content).
 * - Keeps request-building logic away from individual tests.
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

    /** Override the default Accept header used by all requests (JSON by default). */
    public MvcTestClient withDefaultAccept(MediaType accept) {
        this.defaultAccept = accept;
        return this;
    }

    // --- request + assert 200 OK + JSON deserialization -----------------------
    // Use these in tests by default.

    public <T> T getAndReadOk(String url, Map<String, String> params, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            getOk(url, params, accepts);
            return null;
        }
        return read(getOk(url, params, accepts), type);
    }

    public <T> T getAndReadOk(String url, Map<String, String> params, TypeReference<T> typeRef, MediaType... accepts) {
        return read(getOk(url, params, accepts), typeRef);
    }

    public <T> T postAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            postOk(url, body, accepts);
            return null;
        }
        return read(postOk(url, body, accepts), type);
    }

    public <T> T postAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(postOk(url, body, accepts), typeRef);
    }

    public <T> T putAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            putOk(url, body, accepts);
            return null;
        }
        return read(putOk(url, body, accepts), type);
    }

    public <T> T putAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(putOk(url, body, accepts), typeRef);
    }

    public <T> T deleteAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            deleteOk(url, body, accepts);
            return null;
        }
        return read(deleteOk(url, body, accepts), type);
    }

    public <T> T deleteAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(deleteOk(url, body, accepts), typeRef);
    }

    // --- No-throws convenience (assert 200 OK inside) -------------------------------------------
    private MvcResult getOk(String url, Map<String, String> params, MediaType... accepts) {
        try {
            return get(url, params, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("GET " + url + " failed", e);
        }
    }

    private MvcResult postOk(String url, Object body, MediaType... accepts) {
        try {
            return postJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("POST " + url + " failed", e);
        }
    }

    private MvcResult putOk(String url, Object body, MediaType... accepts) {
        try {
            return putJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("PUT " + url + " failed", e);
        }
    }

    private MvcResult deleteOk(String url, Object body, MediaType... accepts) {
        try {
            return deleteJson(url, body, accepts).andExpect(status().isNoContent()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("DELETE " + url + " failed", e);
        }
    }

    // --- HTTP performers (low-level, throw checked Exception) -----------------------------------
    private ResultActions get(String url, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyAccept(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts)
        );
    }

    private ResultActions get(String url, Map<String, String> params, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder rb =
            applyAccept(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts);
        if (params != null) params.forEach(rb::param);
        return mockMvc.perform(rb);
    }

    private ResultActions postJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyAccept(post(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    private ResultActions putJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyAccept(put(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    private ResultActions deleteJson(String url, Object body, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder rb = applyAccept(delete(url), accepts)
            .contentType(MediaType.APPLICATION_JSON);
        if (body != null) rb.content(objectMapper.writeValueAsString(body));
        return mockMvc.perform(rb);
    }

    // --- Shortcuts that parse JSON bodies --------------------------------------------------------
    private <T> T read(MvcResult result, Class<T> type) {
        try {
            return objectMapper.readValue(body(result), type);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body as " + type.getSimpleName(), e);
        }
    }

    private <T> T read(MvcResult result, TypeReference<T> typeRef) {
        try {
            return objectMapper.readValue(body(result), typeRef);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body via TypeReference", e);
        }
    }

    // --- Internal helpers ------------------------------------------------------------------------
    private MockHttpServletRequestBuilder applyAccept(MockHttpServletRequestBuilder rb, MediaType... accepts) {
        return (accepts != null && accepts.length > 0) ? rb.accept(accepts) : rb.accept(defaultAccept);
    }

    // --- Misc helpers ----------------------------------------------------------------------------
    private static String body(MvcResult result) throws Exception {
        MockHttpServletResponse resp = result.getResponse();
        return resp.getContentAsString();
    }
}

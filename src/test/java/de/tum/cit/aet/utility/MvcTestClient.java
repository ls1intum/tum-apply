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
    private final ObjectMapper om;

    public MvcTestClient(MockMvc mockMvc, ObjectMapper om) {
        this.mockMvc = mockMvc;
        this.om = om;
    }

    // --- Defaults --------------------------------------------------------------------------------
    private MediaType defaultAccept = MediaType.APPLICATION_JSON;

    /** Override the default Accept header used by all requests (JSON by default). */
    public MvcTestClient withDefaultAccept(MediaType accept) {
        this.defaultAccept = accept;
        return this;
    }

    // --- Internal helpers ------------------------------------------------------------------------
    private MockHttpServletRequestBuilder applyAccept(MockHttpServletRequestBuilder rb, MediaType... accepts) {
        return (accepts != null && accepts.length > 0) ? rb.accept(accepts) : rb.accept(defaultAccept);
    }

    // --- HTTP performers ---------------------
    public ResultActions get(String url, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyAccept(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts)
        );
    }

    public ResultActions get(String url, Map<String, String> params, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder rb =
            applyAccept(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts);
        if (params != null) params.forEach(rb::param);
        return mockMvc.perform(rb);
    }

    public ResultActions postJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyAccept(post(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body))
        );
    }

    public ResultActions putJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyAccept(put(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body))
        );
    }

    public ResultActions deleteJson(String url, Object body, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder rb = applyAccept(delete(url), accepts)
            .contentType(MediaType.APPLICATION_JSON);
        if (body != null) rb.content(om.writeValueAsString(body));
        return mockMvc.perform(rb);
    }

    // --- No-throws convenience (assert 200 OK inside) -------------------------------------------
    public MvcResult getOk(String url, Map<String, String> params, MediaType... accepts) {
        try {
            return get(url, params, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("GET " + url + " failed", e);
        }
    }

    public MvcResult postOk(String url, Object body, MediaType... accepts) {
        try {
            return postJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("POST " + url + " failed", e);
        }
    }

    public <T> T getAndReadOk(String url, Map<String, String> params, Class<T> type, MediaType... accepts) {
        return read(getOk(url, params, accepts), type);
    }

    public <T> T getAndReadOk(String url, Map<String, String> params, TypeReference<T> typeRef, MediaType... accepts) {
        return read(getOk(url, params, accepts), typeRef);
    }

    public <T> T postAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        return read(postOk(url, body, accepts), type);
    }

    public <T> T postAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(postOk(url, body, accepts), typeRef);
    }

    // --- Shortcuts that parse JSON bodies --------------------------------------------------------
    public <T> T read(MvcResult result, Class<T> type) {
        try {
            return om.readValue(body(result), type);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body as " + type.getSimpleName(), e);
        }
    }

    public <T> T read(MvcResult result, TypeReference<T> typeRef) {
        try {
            return om.readValue(body(result), typeRef);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body via TypeReference", e);
        }
    }

    public <T> T postAndRead(String url, Object body, Class<T> type, MediaType... accepts) throws Exception {
        MvcResult res = postJson(url, body, accepts).andReturn();
        return read(res, type);
    }

    // --- Misc helpers ----------------------------------------------------------------------------
    public static String body(MvcResult result) throws Exception {
        MockHttpServletResponse resp = result.getResponse();
        return resp.getContentAsString();
    }
}

/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */
package org.opencastproject.lti.endpoint;

import org.opencastproject.index.service.catalog.adapter.MetadataList;
import org.opencastproject.lti.service.api.LtiFileUpload;
import org.opencastproject.lti.service.api.LtiJob;
import org.opencastproject.lti.service.api.LtiService;
import org.opencastproject.metadata.dublincore.MetadataParsingException;
import org.opencastproject.security.api.UnauthorizedException;
import org.opencastproject.serviceregistry.api.RemoteBase;
import org.opencastproject.util.NotFoundException;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.entity.mime.content.InputStreamBody;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.ws.rs.core.Response;

public class LtiServiceRemoteImpl extends RemoteBase implements LtiService {
  private static final Gson gson = new Gson();

  public LtiServiceRemoteImpl() {
    super(LtiService.JOB_TYPE);
  }

  private HttpResponse safeGetResponse(final HttpRequestBase r) {
    final HttpResponse response = getResponse(r);
    if (response == null) {
      throw new RuntimeException("No response from service");
    }
    return response;
  }

  @Override
  public List<LtiJob> listJobs(final String seriesId) {
    HttpResponse response = null;
    try {
      response = safeGetResponse(new HttpGet("/jobs?seriesId=" + seriesId));
      return gson.fromJson(
              new InputStreamReader(response.getEntity().getContent(), StandardCharsets.UTF_8),
              new TypeToken<List<LtiJob>>() {
              }.getType());
    } catch (IOException e) {
      throw new RuntimeException("failed retrieving jobs", e);
    } finally {
      closeConnection(response);
    }
  }

  @Override
  public void upsertEvent(
          final LtiFileUpload file,
          final String captions,
          final String eventId,
          final String seriesId,
          final String metadataJson) {
    final MultipartEntityBuilder entity = MultipartEntityBuilder.create();
    entity.addTextBody("isPartOf", seriesId);
    entity.addTextBody("eventId", eventId);
    entity.addTextBody("captions", captions);
    entity.addTextBody("metadata", metadataJson);
    entity.addPart(file.getSourceName(), new InputStreamBody(file.getStream(), file.getSourceName()));
    final HttpPost post = new HttpPost("/");
    post.setEntity(entity.build());
    closeConnection(safeGetResponse(post));
    throw new RuntimeException("Unable to put file");
  }

  @Override
  public void copyEventToSeries(final String eventId, final String seriesId) {
    final HttpPost get = new HttpPost("/" + eventId + "/copy?seriesId=" + seriesId);
    final HttpResponse response = getResponse(get);
    if (response == null) {
      throw new RuntimeException("No response from service");
    }
    closeConnection(response);
  }

  @Override
  public MetadataList getEventMetadata(final String eventId) throws NotFoundException, UnauthorizedException {
    HttpResponse response = null;
    try {
      response = safeGetResponse(new HttpGet("/" + eventId + "/metadata"));
      if (response.getStatusLine().getStatusCode() == Response.Status.NOT_FOUND.getStatusCode()) {
        throw new NotFoundException("event not found: " + eventId);
      }
      if (response.getStatusLine().getStatusCode() == Response.Status.UNAUTHORIZED.getStatusCode()) {
        throw new UnauthorizedException("not authorized to access event with ID " + eventId);
      }
      final MetadataList result = new MetadataList();
      result.fromJSON(IOUtils.toString(response.getEntity().getContent(), StandardCharsets.UTF_8));
      return result;
    } catch (IOException e) {
      throw new RuntimeException("failed retrieving jobs", e);
    } catch (MetadataParsingException e) {
      throw new RuntimeException(e);
    } finally {
      closeConnection(response);
    }
  }

  @Override
  public MetadataList getNewEventMetadata() {
    HttpResponse response = null;
    try {
      response = safeGetResponse(new HttpGet("/new/metadata"));
      final MetadataList result = new MetadataList();
      result.fromJSON(IOUtils.toString(response.getEntity().getContent(), StandardCharsets.UTF_8));
      return result;
    } catch (IOException e) {
      throw new RuntimeException("failed retrieving jobs", e);
    } catch (MetadataParsingException e) {
      throw new RuntimeException(e);
    } finally {
      closeConnection(response);
    }
  }

  @Override
  public void setEventMetadataJson(final String eventId, final String metadataJson)
          throws NotFoundException, UnauthorizedException {
    final MultipartEntityBuilder entity = MultipartEntityBuilder.create();
    entity.addTextBody("metadata", metadataJson);
    final HttpPost post = new HttpPost("/" + eventId + "/metadata");
    post.setEntity(entity.build());
    HttpResponse response = null;
    try {
      response = safeGetResponse(post);
      if (response.getStatusLine().getStatusCode() == Response.Status.NOT_FOUND.getStatusCode()) {
        throw new NotFoundException("event not found: " + eventId);
      }
      if (response.getStatusLine().getStatusCode() == Response.Status.UNAUTHORIZED.getStatusCode()) {
        throw new UnauthorizedException("not authorized to access event with ID " + eventId);
      }
    } finally {
      closeConnection(response);
    }
  }

  @Override
  public void delete(String eventId) {
    final HttpDelete post = new HttpDelete("/" + eventId);
    final HttpResponse response = getResponse(post, Response.Status.NO_CONTENT.getStatusCode());
    if (response == null) {
      throw new RuntimeException("No response from service");
    }
  }
}

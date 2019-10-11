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

import org.opencastproject.lti.service.api.LtiEditMetadata;
import org.opencastproject.lti.service.api.LtiJob;
import org.opencastproject.lti.service.api.LtiService;
import org.opencastproject.serviceregistry.api.RemoteBase;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.entity.mime.content.InputStreamBody;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import javax.ws.rs.core.Response;

public class LtiServiceRemoteImpl extends RemoteBase implements LtiService {
  private static final Gson gson = new Gson();

  public LtiServiceRemoteImpl() {
    super(LtiService.JOB_TYPE);
  }

  @Override
  public List<LtiJob> listJobs(String seriesName, String seriesId) {
    HttpResponse response = null;
    try {
      HttpGet get = new HttpGet("/jobs?series_name" + seriesName + "&series=" + seriesId);
      response = getResponse(get);
      if (response == null) {
        throw new RuntimeException("No response from service");
      }
      return gson.fromJson(
              new InputStreamReader(response.getEntity().getContent(), StandardCharsets.UTF_8),
              new TypeToken<List<LtiJob>>(){}.getType());
    } catch (IOException e) {
      throw new RuntimeException("failed retrieving jobs", e);
    } finally {
      closeConnection(response);
    }
  }

  @Override
  public void upload(InputStream file, String captions, String sourceName, String seriesId, String seriesName,
          Map<String, String> metadata) {
    MultipartEntityBuilder entity = MultipartEntityBuilder.create();
    entity.addTextBody("isPartOf", seriesId);
    entity.addTextBody("seriesName", seriesName);
    entity.addTextBody("captions", captions);
    metadata.forEach(entity::addTextBody);
    entity.addPart(sourceName, new InputStreamBody(file, sourceName));
    HttpPost post = new HttpPost("/");
    post.setEntity(entity.build());
    closeConnection(getResponse(post));
    throw new RuntimeException("Unable to put file");
  }

  @Override
  public LtiEditMetadata editMetadata() {
    HttpResponse response = null;
    try {
      HttpGet get = new HttpGet("/editMetadata");
      response = getResponse(get);
      if (response == null) {
        throw new RuntimeException("No response from service");
      }
      return gson.fromJson(
              new InputStreamReader(response.getEntity().getContent(), StandardCharsets.UTF_8),
              new TypeToken<LtiEditMetadata>(){}.getType());
    } catch (IOException e) {
      throw new RuntimeException("failed retrieving jobs", e);
    } finally {
      closeConnection(response);
    }
  }

  @Override
  public void delete(String eventId) {
    HttpDelete post = new HttpDelete("/" + eventId);
    HttpResponse response = getResponse(post, Response.Status.NO_CONTENT.getStatusCode());
    if (response == null) {
      throw new RuntimeException("No response from service");
    }
  }
}

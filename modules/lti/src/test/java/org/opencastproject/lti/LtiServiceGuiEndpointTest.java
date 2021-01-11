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

package org.opencastproject.lti;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.opencastproject.lti.service.api.LtiService;
import org.opencastproject.security.api.UnauthorizedException;

import org.apache.http.HttpStatus;
import org.easymock.EasyMock;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Response;

public class LtiServiceGuiEndpointTest {

  private LtiServiceGuiEndpoint endpoint = null;
  private LtiService service = null;

  @Before
  public void setUp() throws Exception {
    service  = EasyMock.createNiceMock(LtiService.class);

    endpoint = new LtiServiceGuiEndpoint();
    endpoint.setService(service);
  }

  @After
  public void tearDown() throws Exception {
  }

  @Test
  public void testGetEventMetadata() throws UnauthorizedException {
    Response endpointResponse = endpoint.getNewEventMetadata();
    assertNotNull(endpointResponse);
  }

  @Test
  public void testUploadVTTCaptions() throws Exception {
    HttpServletRequest req = EasyMock.createNiceMock(HttpServletRequest.class);
    ServletInputStream mockInputStream = EasyMock.createNiceMock(ServletInputStream.class);
    // ServletInputStream mockInputStream = getNewServletInputStream();

    String metadata = "[{'flavor':'dublincore/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'Testing metadata','required':true},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','collection':{'Test':'Test'},'type':'mixed_text','value':['Test'],'required':false},{'readOnly':true,'id':'publisher','label':'EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER','type':'text','value':'Administrator','required':false}]}]";
    // String captionsContent = returnResourceAsString("example.vtt", StandardCharsets.UTF_8);
    // String presenter = returnResourceAsString("aonlycropped.mov", StandardCharsets.UTF_16LE);
    File captions = Paths.get(getClass().getClassLoader().getResource("example.vtt").toURI()).toFile();
    File presenter = Paths.get(getClass().getClassLoader().getResource("aonlycropped.mov").toURI()).toFile();

    /*
    EasyMock.expect(req.getAttribute("metadata")).andReturn(metadata).anyTimes();
    EasyMock.expect(req.getAttribute("eventId")).andReturn("testEvent").anyTimes();
    EasyMock.expect(req.getAttribute("seriesId")).andReturn("testSeries").anyTimes();
    EasyMock.expect(req.getAttribute("captions")).andReturn(captions).anyTimes();
    EasyMock.expect(req.getAttribute("presenter")).andReturn(presenter).anyTimes();
    EasyMock.expect(req.getAttribute("captionFormat")).andReturn("vtt").anyTimes();
    EasyMock.expect(req.getAttribute("captionLanguage")).andReturn("en").anyTimes();
    */

    // String captionsContent = FileUtils.readFileToString(captions, StandardCharsets.UTF_8);
    // byte[] presenterContent = Files.readAllBytes(presenter.toPath());

    req.setAttribute("metadata", metadata);
    req.setAttribute("eventId", "testEvent");
    req.setAttribute("seriesId", "testSeries");
    req.setAttribute("captions", captions);
    req.setAttribute("presenter", presenter);
    req.setAttribute("captionFormat", "vtt");
    req.setAttribute("captionLanguage", "en");

    /* 
    byte[] buffer = new byte[4096];
    EasyMock.expect(mockInputStream.read(buffer, 0, 4096)).andReturn(4096).anyTimes();
    EasyMock.expect(req.getInputStream()).andReturn(mockInputStream).anyTimes();

    EasyMock.expect(req.getMethod()).andReturn("POST").anyTimes();
    EasyMock.expect(req.getContentType()).andReturn("multipart/form-data; boundary=-----123456789").anyTimes();
    EasyMock.replay(req); //mockInputStream

    Response createEventResponse = endpoint.createNewEvent("application/json", req);
    assertNotNull(createEventResponse);
    assertEquals(HttpStatus.SC_CREATED, createEventResponse.getStatusInfo().getReasonPhrase());
    assertEquals(HttpStatus.SC_CREATED, createEventResponse.getStatus());
    */
  }

  @Test
  public void testSearchEpisode() throws Exception {

  }

  private String returnResourceAsString(String resourcePath, Charset charset)
  {
      StringBuilder contentBuilder = new StringBuilder();
      String filePath = getClass().getClassLoader().getResource(resourcePath).getPath();
      try (Stream<String> stream = Files.lines(Paths.get(filePath), charset))
      {
          stream.forEach(s -> contentBuilder.append(s).append("\n"));
      }
      catch (IOException e)
      {
          e.printStackTrace();
      }
      return contentBuilder.toString();
  }

  private ServletInputStream getNewServletInputStream() {
    ServletInputStream servletInputStream = new ServletInputStream() {
      @Override
      public int read() throws IOException {
        return 0;
      }

      @Override
      public boolean isFinished() {
        return false;
      }

      @Override
      public boolean isReady() {
        return false;
      }

      @Override
      public void setReadListener(ReadListener readListener) {
      }
    };
    return servletInputStream;
  }
}

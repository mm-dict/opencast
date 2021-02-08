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

import org.opencastproject.MockServletInputStream;
import org.opencastproject.lti.service.api.LtiService;
import org.opencastproject.security.api.UnauthorizedException;

import org.apache.http.HttpStatus;
import org.easymock.EasyMock;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

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
    EasyMock.expect(req.getInputStream()).andReturn(new MockServletInputStream("testData_upload.txt"));

    EasyMock.expect(req.getMethod()).andReturn("POST").anyTimes();
    EasyMock.expect(req.getContentType()).andReturn("multipart/form-data; boundary=-----------------------------7dd2ad38581480");
    EasyMock.expect(req.getCharacterEncoding()).andReturn("UTF-8");
    EasyMock.expect(req.getContentLength()).andReturn(1024);
    EasyMock.replay(req);

    Response createEventResponse = endpoint.createNewEvent("application/json", req);
    assertNotNull(createEventResponse);
    assertEquals(HttpStatus.SC_OK, createEventResponse.getStatusInfo().getReasonPhrase());
    assertEquals(HttpStatus.SC_OK, createEventResponse.getStatus());
  }

  @Test
  public void testSearchEpisode() throws Exception {

  }
}

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

import org.opencastproject.kernel.security.OAuthConsumerDetailsService;

import org.easymock.EasyMock;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Hashtable;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

public class LtiServletTest {

  private LtiServlet servlet = null;
  private OAuthConsumerDetailsService consumerDetailsService = null;

  @Before
  public void setUp() throws Exception {
    servlet = new LtiServlet();

    consumerDetailsService  = new OAuthConsumerDetailsService();
    Hashtable<String, String> testConsumer = new Hashtable<String, String>();
    testConsumer.put("oauth.consumer.name.1", "testConsumerName");
    testConsumer.put("oauth.consumer.key.1", "testConsumerKey");
    testConsumer.put("oauth.consumer.secret.1", "testConsumerSecret");
    consumerDetailsService.updated(testConsumer);
    servlet.setConsumerDetailsService(consumerDetailsService);
  }

  @After
  public void tearDown() throws Exception {
  }

  @Test
  public void testPostContentItem() throws Exception {
    HttpServletRequest req = EasyMock.createNiceMock(HttpServletRequest.class);
    HttpServletResponse resp = EasyMock.createNiceMock(HttpServletResponse.class);
    HttpSession session = EasyMock.createNiceMock(HttpSession.class);
    StringWriter mockWriter = new StringWriter();

    EasyMock.expect(req.getRequestURI()).andReturn("/lti/ci").anyTimes();
    EasyMock.expect(req.getSession(false)).andReturn(session);

    EasyMock.expect(req.getParameter("consumer_key")).andReturn("testConsumerKey").anyTimes();
    EasyMock.expect(req.getParameter("content_items")).andReturn("content_items").anyTimes();
    EasyMock.expect(req.getParameter("content_item_return_url")).andReturn("https://localhost/lti/test").anyTimes();
    EasyMock.expect(req.getParameter("data")).andReturn("").anyTimes();
    EasyMock.expect(req.getParameter("test")).andReturn("true").anyTimes();

    EasyMock.expect(resp.getWriter()).andReturn(new PrintWriter(mockWriter));
    EasyMock.replay(req, resp);
    servlet.doPost(req, resp);
    EasyMock.verify(req, resp);
  }
}

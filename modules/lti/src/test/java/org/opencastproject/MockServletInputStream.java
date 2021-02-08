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
package org.opencastproject;

import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;

public class MockServletInputStream extends ServletInputStream {

    private InputStream fis = null;
    public MockServletInputStream(String fileName) {
     try {
      // fis = new FileInputStream(fileName);
      fis = getClass().getClassLoader().getResourceAsStream(fileName);
     } catch (Exception genExe) {
      genExe.printStackTrace();
     }
    }
    @Override
    public int read() throws IOException {
     if (fis.available() > 0) {
      return fis.read();
     }
     return 0;
    }

    @Override
    public int read(byte[] bytes, int len, int size) throws IOException {
     if (fis.available() > 0) {
      int length = fis.read(bytes, len, size);
      return length;
     }
     return -1;
    }

    @Override
    public boolean isFinished() {
      // TODO Auto-generated method stub
      return false;
    }

    @Override
    public boolean isReady() {
      // TODO Auto-generated method stub
      return false;
    }

    @Override
    public void setReadListener(ReadListener readListener) {
      // TODO Auto-generated method stub

    }
}

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

import org.apache.commons.io.IOUtils;

public class MockServletInputStream extends ServletInputStream {

    private InputStream fis = null;
    private byte[] inputBytes;
    private int lastIndexRetrieved = -1;
    private ReadListener readListener = null;

    public MockServletInputStream(String fileName) {
     try {
      // fis = new FileInputStream(fileName);
      fis = getClass().getClassLoader().getResourceAsStream(fileName);
      inputBytes = IOUtils.toByteArray(fis);
     } catch (Exception genExe) {
      genExe.printStackTrace();
     }
    }

    /* @Override
    public int read() throws IOException {
     if (fis.available() > 0) {
      return fis.read();
     }
     return 0;
    } */

    @Override
    public int read() throws IOException {
        int i;
        if (!isFinished()) {
            i = inputBytes[lastIndexRetrieved+1];
            lastIndexRetrieved++;
            if (isFinished() && (readListener != null)) {
                try {
                    readListener.onAllDataRead();
                } catch (IOException ex) {
                    readListener.onError(ex);
                    throw ex;
                }
            }
            return i;
        } else {
            return -1;
        }
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
      return (lastIndexRetrieved == inputBytes.length-1);
    }

    @Override
    public boolean isReady() {
      return isFinished();
    }

    @Override
    public void setReadListener(ReadListener readListener) {
        this.readListener = readListener;
        if (!isFinished()) {
            try {
                readListener.onDataAvailable();
            } catch (IOException e) {
                readListener.onError(e);
            }
        } else {
            try {
                readListener.onAllDataRead();
            } catch (IOException e) {
                readListener.onError(e);
            }
        }
    }
}

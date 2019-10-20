package org.opencastproject.lti.service.api;

import java.io.InputStream;

public final class LtiFileUpload {
  private final InputStream stream;
  private final String sourceName;

  public LtiFileUpload(InputStream stream, String sourceName) {
    this.stream = stream;
    this.sourceName = sourceName;
  }

  public InputStream getStream() {
    return stream;
  }

  public String getSourceName() {
    return sourceName;
  }
}

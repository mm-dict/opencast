#!/bin/sh

set -eux

#mvn clean install -DtrimStackTrace=false
cd build
find * -maxdepth 0 -type d -exec echo '{}' \; -exec rm -rf '{}' \;

tar xf opencast-dist-admin-*.tar.gz
tar xf opencast-dist-presentation-*.tar.gz
tar xf opencast-dist-worker-*.tar.gz

mkdir -p shared-storage
ln -s ../../shared-storage opencast-dist-admin/data/opencast
ln -s ../../shared-storage opencast-dist-presentation/data/opencast
ln -s ../../shared-storage opencast-dist-worker/data/opencast

gsed -i 's_localhost:8080_localhost:8081_' opencast-dist-presentation/etc/custom.properties
gsed -i 's_localhost:8080_localhost:8082_' opencast-dist-worker/etc/custom.properties

gsed -i 's_port=8080_port=8081_' opencast-dist-presentation/etc/org.ops4j.pax.web.cfg
gsed -i 's_port=8080_port=8082_' opencast-dist-worker/etc/org.ops4j.pax.web.cfg

for node in admin presentation worker; do
  # configure database
  gsed -i 's_^.*db.jdbc.driver=.*$_org.opencastproject.db.jdbc.driver=org.postgresql.Driver_' \
    "opencast-dist-${node}/etc/custom.properties"
  gsed -i 's_^.*db.jdbc.url=.*$_org.opencastproject.db.jdbc.url=jdbc:postgresql://127.0.0.1/opencast_' \
    "opencast-dist-${node}/etc/custom.properties"
  gsed -i 's_^.*db.jdbc.user=.*$_org.opencastproject.db.jdbc.user=opencast_' \
    "opencast-dist-${node}/etc/custom.properties"
  gsed -i 's_^.*db.jdbc.pass=.*$_org.opencastproject.db.jdbc.pass=dbpassword_' \
    "opencast-dist-${node}/etc/custom.properties"

  # configure organization
  gsed -i 's_^.*admin.ui.url=.*$_prop.org.opencastproject.admin.ui.url=http://localhost:8080_' \
    "opencast-dist-${node}/etc/org.opencastproject.organization-mh_default_org.cfg"
  gsed -i 's_^.*engage.ui.url=.*$_prop.org.opencastproject.engage.ui.url=http://localhost:8081_' \
    "opencast-dist-${node}/etc/org.opencastproject.organization-mh_default_org.cfg"
  gsed -i 's_^.*file.repo.url=.*$_prop.org.opencastproject.file.repo.url=${prop.org.opencastproject.admin.ui.url}_' \
    "opencast-dist-${node}/etc/org.opencastproject.organization-mh_default_org.cfg"
done

gsed -i 's_^.*dispatch.interval=.*$_dispatch.interval=2_' opencast-dist-admin/etc/org.opencastproject.serviceregistry.impl.ServiceRegistryJpaImpl.cfg
gsed -i 's_^.*dispatch.interval=.*$_dispatch.interval=0_' opencast-dist-presentation/etc/org.opencastproject.serviceregistry.impl.ServiceRegistryJpaImpl.cfg
gsed -i 's_^.*dispatch.interval=.*$_dispatch.interval=0_' opencast-dist-worker/etc/org.opencastproject.serviceregistry.impl.ServiceRegistryJpaImpl.cfg

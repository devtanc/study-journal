if [ -z $1 ]; then
  echo "must name the database dump";
  echo "\tex: initial"
  exit 1;
fi

FILEPATH=/dumps/$1
DOCKERPATH=$HOME/Docker/volumes/neo4j

mkdir -p "$DOCKERPATH$FILEPATH"

docker run -it --rm \
  --volume=$DOCKERPATH/data:/data \
  --volume=$DOCKERPATH/logs:/logs \
  --volume=$DOCKERPATH/plugins:/plugins \
  --volume=$DOCKERPATH/dumps:/dumps \
  --volume=$DOCKERPATH/import:/var/lib/neo4j/import \
  --env NEO4J_server_memory_pagecache_size=4G \
  --env NEO4J_server_memory_heap_initial__size=6G \
  --env NEO4J_server_memory_heap_max__size=8G \
  neo4j \
  bin/neo4j-admin database dump --to-path="${FILEPATH}" neo4j
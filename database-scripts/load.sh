if [ -z $1 ]; then
  echo "must specify the database dump folder name to load from";
  echo "\tex: initial"
  exit 1;
fi

FILEPATH=/dumps/$1
DOCKERPATH=$HOME/Docker/volumes/neo4j
LOAD_COMMAND='bin/neo4j-admin database load --from-path="${FILEPATH}" neo4j'
LOAD_COMMAND_OVERRIDE='bin/neo4j-admin database load --from-path="${FILEPATH}" --overwrite-destination neo4j'

if ! [ -f "$DOCKERPATH$FILEPATH/neo4j.dump" ]; then
    echo "File at $DOCKERPATH$FILEPATH/neo4j.dump does not exist"
    exit 1
fi

read -p "Are you sure you wish to load the file at [$FILEPATH/neo4j.dump] into the neo4j database (Y/N)? " -r
if ! [[ "$REPLY" =~ ^[YN]$ ]]; then
  echo "Invalid input"
  exit 1
fi
if [[ "$REPLY" =~ ^[Y]$ ]]; then
  COMMAND=$LOAD_COMMAND
  read -p 'Should the existing database be OVERWRITTEN? (Y/N) ' -r
  if ! [[ "$REPLY" =~ ^[YN]$ ]]; then
    echo "Invalid input"
    exit 1
  fi
  if [[ "$REPLY" =~ ^[Y]$ ]]; then
    COMMAND=$LOAD_COMMAND_OVERRIDE
  fi
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
    $COMMAND
  echo "database loaded"
else
  echo "operation canceled"
  exit 0
fi
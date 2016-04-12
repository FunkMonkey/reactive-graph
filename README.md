# reactive-graph

`reactive-graph` converts a [Graphlib](https://github.com/cpettitt/graphlib) graph into a network of observables / streams (e.g [RxJS](https://github.com/Reactive-Extensions/RxJS) observables, [Kefir](https://github.com/rpominov/kefir) observables, [bacon.js](https://github.com/baconjs/bacon.js) streams).

## Why is this useful?

- Easy serialization and deserialization of reactive networks to / from JSON
- Visualization of reactive networks (dependency graphs) using graph libraries like [Cytoscape.js](http://js.cytoscape.org/) (see image below) or visualization libraries like [d3.js](https://d3js.org/)
- Live-visualization of dataflows
- Creation of reactive networks and pipelines using a visual graph editor

## Rx example

![example graph](./docs/example-graph.png)

Above, you see a simple network (dependency graph) of Rx observables that we want to re-create in this example. Here is a representation of this network as a [Graphlib](https://github.com/cpettitt/graphlib) graph:

```js
import graphlib from 'graphlib';

const graph = new graphlib.Graph();
graph.setNode( 'A', ['Observable.interval', 500] );
graph.setNode( 'B', ['Observable.interval', 1000] );
graph.setNode( 'A_map', ['map', x => 'A' + x] );
graph.setNode( 'A_take5', ['take', 5] );
graph.setNode( 'B_map', ['map', x => 'B' + x] );
graph.setNode( 'AB_concat', ['Observable.concat'] );
graph.setNode( 'subscribe', ['subscribeOnNext', function(x) { console.log(x) } ] );

graph.setEdge( 'A', 'A_map' );
graph.setEdge( 'A_map', 'A_take5' );
graph.setEdge( 'B', 'B_map' );

// setting indexes for sorting
graph.setEdge( 'A_take5', 'AB_concat', 0 );
graph.setEdge( 'B_map', 'AB_concat', 1 );

graph.setEdge( 'AB_concat', 'subscribe' );
```

`reactive-graph` tries to be as flexible as possible. Thus you can attach whatever data you want to the graph nodes (in this case an array with an operator name as the first argument, followed by additional arguments that will be passed to the operator). It is not necessary to attach data to edges, you can however set an index that will be used for sorting the incoming sources, in case that is necessary (f.ex. for `Rx.Observable.concat`).

Due to this flexibility, `reactive-graph` does not know how to insert these operators into the network. Thus we need to provide an `insertOperator` function to take care of this. This function will be called for every node. It receives the node's data and an array of source observables (sorted by the edge indexes) and must return a new observable. The graph's nodes will have been [topologically sorted](https://en.wikipedia.org/wiki/Topological_sorting) first to ensure that all source observables exist before trying to create an operator.

```js
import reactiveGraph from 'reactive-graph';
import Rx from 'rx';

// super simple Rx inserter
function insertOperator( id, operatorConfig, sources ) {
  let operatorName = operatorConfig[0];
  const args = operatorConfig.splice( 1 );

  // static operators
  if( operatorName.startsWith( 'Observable.' ) ) {
    operatorName = operatorName.substr( 11 );
    return Rx.Observable[ operatorName ]( ...sources, ...args );

  // instance operators
  } else {
    // splitting sources - this universal approach will terribly fail, when
    // an operator like `map` has multiple ingoing sources...
    const source = sources[0];
    const restSources = sources.splice( 1 );
    return source[ operatorName ]( ...restSources, ...args );
  }

}

// running the graph; we'll get back a dictionary of the created
// observables (or disposables)
const observables = reactiveGraph.run( graph, insertOperator );
```

Inserter functions can be far more complex than this, possibly providing shared state, custom operators, etc. That is up to the developer.

## API

<a name="run" href="#run">#</a> **run**( graph, insertOperator )

Takes a [Graphlib](https://github.com/cpettitt/graphlib) graph and connects it to an observable network. The seond argument, `insertOperator`, is responsible creating the operator. It receives the user-set operator configuration and an array of source observables.

`run` is equivilant to the following code:
```js
const topsortedNodes = reactiveGraph.getTopsortedNodes( graph );
const observables = reactiveGraph.connectOperators( topsortedNodes, insertOperator );
```
The operation can thus be split into two steps (useful if the same graph should be run multiple times).

<a name="getTopsortedNodes" href="#getTopsortedNodes">#</a> **getTopsortedNodes**( graph )

Takes a [Graphlib](https://github.com/cpettitt/graphlib) graph and returns an array of topsorted graph nodes in the following format:

```js
{
  id,              // id of graph node (string)
  operatorConfig,  // user-set node data (*)
  sources          // ID's of sources (string[])
}
```

<a name="connectOperators" href="#connectOperators">#</a> **connectOperators**( topsortedNodes, insertOperator )

Takes an array of topsorted nodes and connects those nodes by calling the provided `insertOperator` function.

## Development

```
# after cloning, run once
npm run build

# there's also a watcher
npm run watch:build
```

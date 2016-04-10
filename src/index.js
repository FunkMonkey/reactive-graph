import graphlib from 'graphlib';

// TODO: parseInt? NaN to MAX_VALUE?
// TODO: accept Object with 'index' property
const getEdgeIndex = edge => (typeof( edge ) === 'number') ? edge : Number.MAX_VALUE;

function getTopsortedNodes( graph ) {
  const topsortedNodeIDs = graphlib.alg.topsort( graph );

  return topsortedNodeIDs.forEach( id => {
    const value = graph.node( id );
    const inEdges = graph.inEdges( id );

    const predecessors = inEdges.map( inEdge => ({
        index: getEdgeIndex( graph.edge( inEdge ) ),
        id: inEdge.v
      }) )
      .sort( ( preA, preB ) => preA.index - preB.index );

    return {
      id,
      value,
      predecessors
    };
  } );
}

function connectRxOperators( topsortedNodes, insertOperator ) {
  return topsortedNodes.reduce( ( observables, node ) => {
    const sources = node.predecessors.map( pre => observables[ pre.id ] );
    observables[ node.id ] = insertOperator( node.value, sources );
    return observables;
  }, {} );
}

function create ( graph, insertOperator ) {
  return connectRxOperators( getTopsortedNodes( graph ), insertOperator );
}

function insertUsingLet ( getOperatorAndArguments, opConfig, sources ) {
  if( sources.length === 0 ) {
    const opAndArgs = getOperatorAndArguments( opConfig, [] );
    return opAndArgs.operator.apply( null, null, opAndArgs.args );
  } else {
    const source = sources[0];
    const extraSources = sources.slice( 1 );
    const opAndArgs = getOperatorAndArguments( opConfig, extraSources );
    return source.let( o => opAndArgs.operator.apply( null, o, ...opAndArgs.args ) );
  }
}

export default {
  getTopsortedNodes,
  connectRxOperators,
  create,
  insertUsingLet
}

// TYPE DEFINITIONS

/**
 * A user-defined operator configuration. Can basically be anything.
 *
 * @typedef {*}   NodeConfig
 */

/**
 * A graph node information for operators.
 *
 * @typedef {Object} NodeInfo
 * @property {string}          id
 * @property {NodeConfig}      config
 * @property {string[]}        sources - ID's of sources
*/

/**
 * Callback signature for a function that creates a `Observable` from an
 * user-defined observable configuration (taken from a graph node's value) and
 * a set of ingoing `Observable`'s
 *
 * @callback insertNodeCallback
 * @param {string}            id
 * @param {NodeConfig}        config
 * @param {Observable[]}      sources
 * @return {Observable}
 */

import graphlib from 'graphlib';

// TODO: parseInt? NaN to MAX_VALUE?
// TODO: accept Object with 'index' property
const getEdgeIndex = edge => ( ( typeof ( edge ) === 'number' ) ? edge : Number.MAX_VALUE );

/**
 * Returns the nodes as a topsorted array of `NodeInfo`'s. Source nodes are sorted
 * by the ingoing edge's value.
 *
 * @param  {graphlib.Graph}   graph
 * @return {NodeInfo[]}
 */
function getTopsortedNodes( graph ) {
  const topsortedNodeIDs = graphlib.alg.topsort( graph );

  return topsortedNodeIDs.map( id => {
    const config = graph.node( id );
    const inEdges = graph.inEdges( id );

    const sources = inEdges.map( inEdge => ( {
      index: getEdgeIndex( graph.edge( inEdge ) ),
      id: inEdge.v
    } ) )
      .sort( ( preA, preB ) => preA.index - preB.index )
      .map( pre => pre.id );

    return {
      id,
      config,
      sources
    };
  } );
}

/**
 * Connects the graph's nodes by iterating an array of topsorted node infos
 * and calling `insertNode` for every node. Returns a dictionary of the
 * created observables.
 *
 * @param  {NodeInfo[]}                      topsortedNodes
 * @param  {insertNodeCallback}              insertNode
 * @return {Object.<string, Observable>}
 */
function connectNodes( topsortedNodes, insertNode ) {
  return topsortedNodes.reduce( ( observables, node ) => {
    const sources = node.sources.map( preID => observables[ preID ] );
    observables[ node.id ] = insertNode( node.id, node.config, sources );
    return observables;
  }, {} );
}

/**
 * Instantiates a graph by connecting the graph's nodes in a topsorted fashion, calling
 * `insertNode` for every node. Source nodes are sorted by the ingoing
 * edge's value.
 *
 * This function is merely a shortcut for:
 * `connectNodes( getTopsortedNodes( graph ), insertNode )`
 *
 * @param  {graphlib.Graph}           graph
 * @param  {insertNodeCallback}       insertNode
 * @return {Object.<string, Observable>}
 */
function instantiate( graph, insertNode ) {
  return connectNodes( getTopsortedNodes( graph ), insertNode );
}

export default {
  getTopsortedNodes,
  connectNodes,
  instantiate
};

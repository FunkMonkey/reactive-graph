// TYPE DEFINITIONS

/**
 * A user-defined operator configuration. Can basically be anything.
 *
 * @typedef {*}   OperatorConfig
 */

/**
 * A graph node information for operators.
 *
 * @typedef {Object} NodeInfo
 * @property {string}          id
 * @property {OperatorConfig}  operatorConfig
 * @property {string[]}        sources - ID's of sources
*/

/**
 * Callback signature for a function that creates a `Observable` from an
 * user-defined observable configuration (taken from a graph node's value) and
 * a set of ingoing `Observable`'s
 *
 * @callback insertOperatorCallback
 * @param {string}            id
 * @param {OperatorConfig}    operatorConfig
 * @param {Observable[]}      sources
 * @return {Observable}
 */

/**
 * Information for chaining an operator using `Rx.Observable.let`.
 *
 * @typedef {Object} LetObservableInfo
 * @property {Function}   operator   Function to be passed to `let`
 * @property {Object}     context    [Optional] Calling context of the operator function
 * @property {*[]}        args       Additional arguments passed to the operator function
 */

/**
 * Callback signature for a function that creates information for chaining an
 * operator using `Rx.Observable.let`.
 *
 * @callback getLetOperatorCallback
 * @param {OperatorConfig}    operatorConfig
 * @param {Observable[]}      sources         All sources, except for first one,
 *                                            which will be used as `source.let`
 * @return {LetObservableInfo}
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
    const operatorConfig = graph.node( id );
    const inEdges = graph.inEdges( id );

    const sources = inEdges.map( inEdge => ( {
      index: getEdgeIndex( graph.edge( inEdge ) ),
      id: inEdge.v
    } ) )
      .sort( ( preA, preB ) => preA.index - preB.index )
      .map( pre => pre.id );

    return {
      id,
      operatorConfig,
      sources
    };
  } );
}

/**
 * Connects the graph's nodes by iterating an array of topsorted node infos
 * and calling `insertOperator` for every node. Returns a dictionary of the
 * created observables.
 *
 * @param  {NodeInfo[]}                      topsortedNodes
 * @param  {insertOperatorCallback}          insertOperator
 * @return {Object.<string, Observable>}
 */
function connectOperators( topsortedNodes, insertOperator ) {
  return topsortedNodes.reduce( ( observables, node ) => {
    const sources = node.sources.map( preID => observables[ preID ] );
    observables[ node.id ] = insertOperator( node.id, node.operatorConfig, sources );
    return observables;
  }, {} );
}

/**
 * Runs a graph by connecting the graph's nodes in a topsorted fashion, calling
 * `insertOperator` for every node. Source nodes are sorted by the ingoing
 * edge's value.
 *
 * This function is merely a shortcut for:
 * `connectOperators( getTopsortedNodes( graph ), insertOperator )`
 *
 * @param  {graphlib.Graph}           graph
 * @param  {insertOperatorCallback}   insertOperator
 * @return {Object.<string, Observable>}
 */
function run( graph, insertOperator ) {
  return connectOperators( getTopsortedNodes( graph ), insertOperator );
}


/**
 * Utility function that chains operators by using `Rx.Observable.let`.
 *
 * Takes a callback function for providing the function that will be passed to
 * `let` (`operator` property), the calling context and additional arguments
 * (`args`).
 * If no sources are provided, it will be called directly with `null` as the
 * first argument. Otherwise the first element of `sources` will be considered
 * the source for `let`, while the others are passed to `getOperatorContextAndArgs`.
 *
 * @param  {getLetOperatorCallback}  getOperatorContextAndArgs
 * @param  {OperatorConfig}          opConfig
 * @param  {Rx.Observable[] }        sources
 * @return {Rx.Observable}
 */
function insertUsingLet( getOperatorContextAndArgs, opConfig, sources ) {
  if ( sources.length === 0 ) {
    const opAndArgs = getOperatorContextAndArgs( opConfig, [] );
    return opAndArgs.operator.call( opAndArgs.context || null, null, ...opAndArgs.args );
  }

  const source = sources[0];
  const extraSources = sources.slice( 1 );
  const opAndArgs = getOperatorContextAndArgs( opConfig, extraSources );
  return source.let( o => opAndArgs.operator.call( opAndArgs.context ||
                                                   null, o, ...opAndArgs.args ) );
}

export default {
  getTopsortedNodes,
  connectOperators,
  run,
  insertUsingLet
};

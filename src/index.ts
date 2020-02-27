import { Graph, Edge, alg } from 'graphlib';
import { IObservable, ISubscription } from './IObservable';

/**
 * TConfig: A user-defined operator configuration. Can basically be anything.
 */

export type ObservableOrSubscription<T> = IObservable<T> | ISubscription;

export type InsertNodeCallback<TConfig> =
  ( id: string, config: TConfig, sources: ObservableOrSubscription<any>[] )
  => ObservableOrSubscription<any>;

export interface INodeInfo<TConfig> {
  id: string;
  config: TConfig;
  sources: string[];
}

// TODO: parseInt? NaN to MAX_VALUE?
// TODO: accept Object with 'index' property
const getEdgeIndex = ( edge: number | any ) => ( ( typeof ( edge ) === 'number' ) ? edge : Number.MAX_VALUE );

/**
 * Returns the nodes as a topsorted array of `NodeInfo`'s. Source nodes are sorted
 * by the ingoing edge's value.
 *
 * @param  graph
 * @return
 */
function getTopsortedNodes<TConfig>( graph: Graph<TConfig, number> ): INodeInfo<TConfig>[] {
  const topsortedNodeIDs = alg.topsort( graph );

  return topsortedNodeIDs.map( id => {
    const config = graph.node( id );
    const inEdges = graph.inEdges( id );

    const sources = ( inEdges as Edge[] )
      .map( inEdge => ( {
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
 * @param  topsortedNodes
 * @param  insertNode
 * @return
 */
function connectNodes<TConfig, TNodes = Record<string, ObservableOrSubscription<any>>>(
  topsortedNodes: INodeInfo<TConfig>[],
  insertNode: InsertNodeCallback<TConfig>
) {
  return topsortedNodes.reduce( ( observables, node ) => {
    const sources = node.sources.map( preID => observables[ preID ] );
    observables[ node.id ] = insertNode( node.id, node.config, sources );
    return observables;
  }, {} as Record<string, ObservableOrSubscription<any>> ) as any as TNodes;
}

/**
 * Instantiates a graph by connecting the graph's nodes in a topsorted fashion, calling
 * `insertNode` for every node. Source nodes are sorted by the ingoing
 * edge's value.
 *
 * This function is merely a shortcut for:
 * `connectNodes( getTopsortedNodes( graph ), insertNode )`
 *
 * @param  graph
 * @param  insertNode
 * @return
 */
function instantiate<TConfig, TNodes = Record<string, ObservableOrSubscription<any>>>(
  graph: Graph<TConfig, number>,
  insertNode: InsertNodeCallback<TConfig>
) {
  return connectNodes<TConfig, TNodes>( getTopsortedNodes( graph ), insertNode );
}

/**
 * Destroys a graph by calling `unsubscribe` for every node that is a subscription
 * (e.g. has an `unsubscribe` function, but not a `subscribe` function).
 *
 * @param   nodes
 */
function destroy<TNodes>( nodes: TNodes ) {
  // eslint-disable-next-line no-restricted-syntax
  for ( const nodeName in nodes ) {
    if ( Object.prototype.hasOwnProperty.call( nodes, nodeName ) ) {
      const observableOrSubscription = nodes[nodeName];
      if ( typeof ( observableOrSubscription as any as ISubscription ).unsubscribe === 'function'
           && typeof ( observableOrSubscription as any as IObservable<any> ).subscribe !== 'function' ) {
        ( observableOrSubscription as any as ISubscription ).unsubscribe();
      }
    }
  }
}

export default {
  getTopsortedNodes,
  connectNodes,
  instantiate,
  destroy
};

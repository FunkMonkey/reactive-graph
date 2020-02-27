export interface ISubscription {
  unsubscribe(): void;
  readonly closed: boolean;
}

export interface IObserver<T> {
  closed?: boolean;
  next: ( value: T ) => void;
  error: ( err: any ) => void;
  complete: () => void;
}

export interface IObservable<T> {
  subscribe(): ISubscription;
  subscribe( observer?: IObserver<T> ): ISubscription;
  subscribe( next: null | undefined, error: null | undefined, complete: () => void ): ISubscription;
  subscribe( next: null | undefined, error: ( error: any ) => void, complete?: () => void ): ISubscription;
  subscribe( next: ( value: T ) => void, error: null | undefined, complete: () => void ): ISubscription;
  subscribe( next?: ( value: T ) => void, error?: ( error: any ) => void, complete?: () => void ): ISubscription;
}

export interface ISubject<T> extends IObserver<T>, IObservable<T> {}

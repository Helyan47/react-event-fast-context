import React, { useRef, createContext, useContext, useCallback, useSyncExternalStore } from 'react';
import { v4 as uuid } from 'uuid';
import { getDefaultEvents } from './utils';

export type TEvent = {
	id: string;
	startDate: string;
	endDate: string;
	title: string;
};

type Store = { events: Record<string, Array<TEvent>>; nothing: undefined | string; currentView: string };

function useStoreData(initialState?: Store): {
	get: () => Store;
	add: (day: string) => void;
	removeLastEvent: (day: string) => void;
	editCurrentView: (view: string) => void;
	subscribe: (callback: () => void) => () => void;
} {
	const store = useRef<Store>(
		initialState || {
			events: {},
			nothing: undefined,
			currentView: 'month',
		},
	);

	const get = useCallback(() => store.current, []);

	const subscribers = useRef(new Set<() => void>());

	const add = useCallback((day: string) => {
		const dayEvents = store.current.events[day] || [];
		store.current.events[day] = [...dayEvents, { id: uuid(), startDate: day, endDate: day, title: 'New Event' }];
		subscribers.current.forEach((callback) => callback());
	}, []);

	const removeLastEvent = useCallback((day: string) => {
		const dayEvents = store.current.events[day] || [];
		if (dayEvents.length === 0) return;
		store.current.events[day] = dayEvents.slice(0, -1);
		subscribers.current.forEach((callback) => callback());
	}, []);

	const editCurrentView = useCallback((view: string) => {
		store.current.currentView = view;
		subscribers.current.forEach((callback) => callback());
	}, []);

	const subscribe = useCallback((callback: () => void) => {
		subscribers.current.add(callback);
		return () => subscribers.current.delete(callback);
	}, []);

	return {
		get,
		add,
		removeLastEvent,
		editCurrentView,
		subscribe,
	};
}

type UseStoreDataReturnType = ReturnType<typeof useStoreData>;

const StoreContext = createContext<UseStoreDataReturnType | null>(null);

export function Provider({ children }: { children: React.ReactNode }) {
	return (
		<StoreContext.Provider value={useStoreData({ events: getDefaultEvents(), nothing: undefined, currentView: 'month' })}>
			{children}
		</StoreContext.Provider>
	);
}

export function useStore<SelectorOutput>(selector: (store: Store) => SelectorOutput): {
	state: SelectorOutput;
	addEvent: (day: string) => void;
	removeEvent: (day: string) => void;
	editCurrentView: (view: string) => void;
} {
	const store = useContext(StoreContext);
	if (!store) {
		throw new Error('Store not found');
	}

	const state = useSyncExternalStore(
		store.subscribe,
		() => selector(store.get()),
		() => selector({ events: {}, nothing: undefined, currentView: 'month' }),
	);

	return { state, addEvent: store.add, removeEvent: store.removeLastEvent, editCurrentView: store.editCurrentView };
}

export function useFastContextFields<
	SelectorOutput,
	T extends {
		state: Record<string, { get: SelectorOutput }>;
		addEvent?: (day: string) => void;
		removeEvent?: (day: string) => void;
		editCurrentView?: (view: string) => void;
	},
>(fieldNames: Array<{ key: string; selector: Array<string> }>): T {
	const gettersAndSetters: T = { state: {} } as T;
	for (const fieldName of fieldNames) {
		const store = useStore((fc) => {
			let current: any = fc;
			for (const field of fieldName.selector) {
				current = current[field];
			}
			return current;
		});
		gettersAndSetters.state[fieldName.key] = {
			get: store.state,
		};
		gettersAndSetters.addEvent = store.addEvent;
		gettersAndSetters.removeEvent = store.removeEvent;
		gettersAndSetters.editCurrentView = store.editCurrentView;
	}

	return gettersAndSetters;
}

export default Provider;

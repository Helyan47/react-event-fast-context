import React, { useRef, createContext, useContext, useCallback, useSyncExternalStore } from 'react';
import { v4 as uuid } from 'uuid';

type TEvent = {
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

function Provider({ children }: { children: React.ReactNode }) {
	return (
		<StoreContext.Provider value={useStoreData({ events: getDefaultEvents(), nothing: undefined, currentView: 'month' })}>
			{children}
		</StoreContext.Provider>
	);
}

function useStore<SelectorOutput>(selector: (store: Store) => SelectorOutput): {
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

function useFastContextFields<
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

const EventActions = ({ day }: { day: { date: Date; stringDate: string } }) => {
	const { state: fieldValue, addEvent, removeEvent, editCurrentView } = useStore((store) => undefined);
	const { state: currentView } = useStore((store) => store.currentView);
	return (
		<div className='field'>
			<button
				onClick={() => {
					addEvent(day.stringDate);
					editCurrentView(currentView === 'month' ? 'week' : 'month');
				}}
			>
				Add Event
			</button>
			<button
				onClick={() => {
					removeEvent(day.stringDate);
					editCurrentView(currentView === 'month' ? 'week' : 'month');
				}}
			>
				Remove Last Event
			</button>
		</div>
	);
};

const Display = ({
	day,
}: {
	day: {
		date: Date;
		stringDate: string;
	};
}) => {
	// USING USEFASTCONTEXTFIELDS
	// const data = useFastContextFields<
	// 	unknown,
	// 	{
	// 		state: {
	// 			events: { get: Array<TEvent> };
	// 			currentView: { get: string };
	// 		};
	// 		addEvent: (day: string) => void;
	// 		removeEvent: (day: string) => void;
	// 		editCurrentView: (view: string) => void;
	// 	}
	// >([
	// 	{ key: 'events', selector: ['events', day.stringDate] },
	// 	{ key: 'currentView', selector: ['currentView'] },
	// ]);
	// const fieldValue = data.state.events.get || [];
	// const currentView = data.state.currentView.get;

	// USING DUPLICATE USESTORE
	const { state: fieldValue } = useStore((store) => store.events[day.stringDate]);
	const { state: currentView } = useStore((store) => store.currentView);
	console.log(`CurrentView[${day.stringDate}]: ${currentView}`);
	console.log(`CurrentView[${day.stringDate}]: ${(fieldValue || []).length}`);

	// EN AMBOS CASOS, EL NUMERO DE RENDERIZADOS ES EL MISMO (1) AUNQUE CAMBIEN LOS DATOS A LA VEZ
	return (
		<div className='value' style={{ display: 'flex', gap: '4px' }}>
			<span>{currentView as string}</span>
			<span style={{ fontWeight: 'bold' }}>{day.stringDate}</span>
			<span>{'Events: ' + (fieldValue || []).length}</span>
		</div>
	);
};

const ContentContainer = () => {
	const dates = getActualMonthDays();
	return (
		<div className='container'>
			<h5>ContentContainer</h5>
			<div style={{ display: 'flex', flexWrap: 'wrap' }}>
				{dates.map((date) => (
					<div key={date.stringDate} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<Display day={date} />
						<EventActions day={date} />
					</div>
				))}
			</div>
		</div>
	);
};

function App() {
	return (
		<Provider>
			<div className='container'>
				<h5>App</h5>
				<ContentContainer />
			</div>
		</Provider>
	);
}

function getActualMonthDays() {
	const date = new Date();
	const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
	return days.map((day) => {
		const newDate = new Date(date.getFullYear(), date.getMonth(), day);
		return {
			date: newDate,
			stringDate: `${date.getFullYear()}-${date.getMonth() + 1}-${day}`,
		};
	});
}

function getDefaultEvents(): Record<string, Array<TEvent>> {
	return {
		'2024-5-1': [
			{ id: '1', startDate: '2024-5-1', endDate: '2024-5-1', title: 'Labor Day' },
			{ id: '2', startDate: '2024-5-1', endDate: '2024-5-1', title: 'Labor Day2' },
		],
		'2024-5-2': [
			{ id: '3', startDate: '2024-5-2', endDate: '2024-5-2', title: 'Event 1' },
			{ id: '4', startDate: '2024-5-2', endDate: '2024-5-2', title: 'Event 2' },
		],
		'2024-5-3': [
			{ id: '5', startDate: '2024-5-3', endDate: '2024-5-3', title: 'Event 3' },
			{ id: '6', startDate: '2024-5-3', endDate: '2024-5-3', title: 'Event 4' },
		],
		'2024-5-4': [
			{ id: '7', startDate: '2024-5-4', endDate: '2024-5-4', title: 'Event 5' },
			{ id: '8', startDate: '2024-5-4', endDate: '2024-5-4', title: 'Event 6' },
		],
		'2024-5-5': [
			{ id: '9', startDate: '2024-5-5', endDate: '2024-5-5', title: 'Event 7' },
			{ id: '10', startDate: '2024-5-5', endDate: '2024-5-5', title: 'Event 8' },
		],
		'2024-5-6': [
			{ id: '11', startDate: '2024-5-6', endDate: '2024-5-6', title: 'Event 9' },
			{ id: '12', startDate: '2024-5-6', endDate: '2024-5-6', title: 'Event 10' },
		],
		'2024-5-7': [
			{ id: '13', startDate: '2024-5-7', endDate: '2024-5-7', title: 'Event 11' },
			{ id: '14', startDate: '2024-5-7', endDate: '2024-5-7', title: 'Event 12' },
		],
		'2024-5-8': [
			{ id: '15', startDate: '2024-5-8', endDate: '2024-5-8', title: 'Event 13' },
			{ id: '16', startDate: '2024-5-8', endDate: '2024-5-8', title: 'Event 14' },
		],
		'2024-5-9': [
			{ id: '17', startDate: '2024-5-9', endDate: '2024-5-9', title: 'Event 15' },
			{ id: '18', startDate: '2024-5-9', endDate: '2024-5-9', title: 'Event 16' },
		],
		'2024-5-10': [
			{ id: '19', startDate: '2024-5-10', endDate: '2024-5-10', title: 'Event 17' },
			{ id: '20', startDate: '2024-5-10', endDate: '2024-5-10', title: 'Event 18' },
		],
		'2024-5-11': [
			{ id: '21', startDate: '2024-5-11', endDate: '2024-5-11', title: 'Event 19' },
			{ id: '22', startDate: '2024-5-11', endDate: '2024-5-11', title: 'Event 20' },
		],
		'2024-5-12': [
			{ id: '23', startDate: '2024-5-12', endDate: '2024-5-12', title: 'Event 21' },
			{ id: '24', startDate: '2024-5-12', endDate: '2024-5-12', title: 'Event 22' },
		],
		'2024-5-13': [
			{ id: '25', startDate: '2024-5-13', endDate: '2024-5-13', title: 'Event 23' },
			{ id: '26', startDate: '2024-5-13', endDate: '2024-5-13', title: 'Event 24' },
		],
		'2024-5-14': [
			{ id: '27', startDate: '2024-5-14', endDate: '2024-5-14', title: 'Event 25' },
			{ id: '28', startDate: '2024-5-14', endDate: '2024-5-14', title: 'Event 26' },
		],
		'2024-5-15': [
			{ id: '29', startDate: '2024-5-15', endDate: '2024-5-15', title: 'Event 27' },
			{ id: '30', startDate: '2024-5-15', endDate: '2024-5-15', title: 'Event 28' },
		],
		'2024-5-16': [
			{ id: '31', startDate: '2024-5-16', endDate: '2024-5-16', title: 'Event 29' },
			{ id: '32', startDate: '2024-5-16', endDate: '2024-5-16', title: 'Event 30' },
		],
		'2024-5-17': [
			{ id: '33', startDate: '2024-5-17', endDate: '2024-5-17', title: 'Event 31' },
			{ id: '34', startDate: '2024-5-17', endDate: '2024-5-17', title: 'Event 32' },
		],
		'2024-5-18': [
			{ id: '35', startDate: '2024-5-18', endDate: '2024-5-18', title: 'Event 33' },
			{ id: '36', startDate: '2024-5-18', endDate: '2024-5-18', title: 'Event 34' },
		],
		'2024-5-19': [
			{ id: '37', startDate: '2024-5-19', endDate: '2024-5-19', title: 'Event 35' },
			{ id: '38', startDate: '2024-5-19', endDate: '2024-5-19', title: 'Event 36' },
		],
		'2024-5-20': [
			{ id: '39', startDate: '2024-5-20', endDate: '2024-5-20', title: 'Event 37' },
			{ id: '40', startDate: '2024-5-20', endDate: '2024-5-20', title: 'Event 38' },
		],
		'2024-5-21': [
			{ id: '41', startDate: '2024-5-21', endDate: '2024-5-21', title: 'Event 39' },
			{ id: '42', startDate: '2024-5-21', endDate: '2024-5-21', title: 'Event 40' },
		],
		'2024-5-22': [
			{ id: '43', startDate: '2024-5-22', endDate: '2024-5-22', title: 'Event 41' },
			{ id: '44', startDate: '2024-5-22', endDate: '2024-5-22', title: 'Event 42' },
		],
		'2024-5-23': [
			{ id: '45', startDate: '2024-5-23', endDate: '2024-5-23', title: 'Event 43' },
			{ id: '46', startDate: '2024-5-23', endDate: '2024-5-23', title: 'Event 44' },
		],
		'2024-5-24': [
			{ id: '47', startDate: '2024-5-24', endDate: '2024-5-24', title: 'Event 45' },
			{ id: '48', startDate: '2024-5-24', endDate: '2024-5-24', title: 'Event 46' },
		],
		'2024-5-25': [
			{ id: '49', startDate: '2024-5-25', endDate: '2024-5-25', title: 'Event 47' },
			{ id: '50', startDate: '2024-5-25', endDate: '2024-5-25', title: 'Event 48' },
		],
		'2024-5-26': [
			{ id: '51', startDate: '2024-5-26', endDate: '2024-5-26', title: 'Event 49' },
			{ id: '52', startDate: '2024-5-26', endDate: '2024-5-26', title: 'Event 50' },
		],
		'2024-5-27': [
			{ id: '53', startDate: '2024-5-27', endDate: '2024-5-27', title: 'Event 51' },
			{ id: '54', startDate: '2024-5-27', endDate: '2024-5-27', title: 'Event 52' },
		],
		'2024-5-28': [
			{ id: '55', startDate: '2024-5-28', endDate: '2024-5-28', title: 'Event 53' },
			{ id: '56', startDate: '2024-5-28', endDate: '2024-5-28', title: 'Event 54' },
		],
		'2024-5-29': [
			{ id: '57', startDate: '2024-5-29', endDate: '2024-5-29', title: 'Event 55' },
			{ id: '58', startDate: '2024-5-29', endDate: '2024-5-29', title: 'Event 56' },
		],
		'2024-5-30': [
			{ id: '59', startDate: '2024-5-30', endDate: '2024-5-30', title: 'Event 57' },
			{ id: '60', startDate: '2024-5-30', endDate: '2024-5-30', title: 'Event 58' },
		],
		'2024-5-31': [
			{ id: '61', startDate: '2024-5-31', endDate: '2024-5-31', title: 'Event 59' },
			{ id: '62', startDate: '2024-5-31', endDate: '2024-5-31', title: 'Event 60' },
		],
	};
}

export default App;

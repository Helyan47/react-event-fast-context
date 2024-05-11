import React from 'react';
import Provider, { useStore } from './Context';

const EventActions = ({ day }: { day: { date: Date; stringDate: string } }) => {
	const { addEvent, removeEvent, editCurrentView } = useStore((store) => undefined);

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

export default App;

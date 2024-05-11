import { TEvent, useFastContextFields, useStore } from '../Context';

export const DisplayWithMultiSelector = ({
	day,
}: {
	day: {
		date: Date;
		stringDate: string;
	};
}) => {
	// USING USEFASTCONTEXTFIELDS
	const data = useFastContextFields<
		unknown,
		{
			state: {
				events: { get: Array<TEvent> };
				currentView: { get: string };
			};
			addEvent: (day: string) => void;
			removeEvent: (day: string) => void;
			editCurrentView: () => void;
		}
	>([
		{ key: 'events', selector: ['events', day.stringDate] },
		{ key: 'currentView', selector: ['currentView'] },
	]);
	const fieldValue = data.state.events.get || [];
	const currentView = data.state.currentView.get;

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

export const DisplayWithCurrentView = ({
	day,
}: {
	day: {
		date: Date;
		stringDate: string;
	};
}) => {
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

export const DisplayWithoutCurrentView = ({
	day,
}: {
	day: {
		date: Date;
		stringDate: string;
	};
}) => {
	// USING DUPLICATE USESTORE
	const { state: fieldValue } = useStore((store) => store.events[day.stringDate]);

	// EN AMBOS CASOS, EL NUMERO DE RENDERIZADOS ES EL MISMO (1) AUNQUE CAMBIEN LOS DATOS A LA VEZ
	return (
		<div className='value' style={{ display: 'flex', gap: '4px' }}>
			<span style={{ fontWeight: 'bold' }}>{day.stringDate}</span>
			<span>{'Events: ' + (fieldValue || []).length}</span>
		</div>
	);
};

export const EventActions = ({ day }: { day: { date: Date; stringDate: string } }) => {
	const { addEvent, removeEvent, editCurrentView } = useStore((store) => undefined);
	return (
		<div className='field'>
			<button
				onClick={() => {
					addEvent(day.stringDate);
					editCurrentView();
				}}
			>
				Add Event
			</button>
			<button
				onClick={() => {
					removeEvent(day.stringDate);
					editCurrentView();
				}}
			>
				Remove Last Event
			</button>
		</div>
	);
};

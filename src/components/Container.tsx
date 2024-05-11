import { getActualMonthDays } from '../utils';
import { DisplayWithCurrentView, DisplayWithMultiSelector, DisplayWithoutCurrentView, EventActions } from './Display';

export const ContentContainerWithoutCurrentView = () => {
	const dates = getActualMonthDays();
	return (
		<div className='container'>
			<h5>ContentContainer sin currentView</h5>
			<div style={{ display: 'flex', flexWrap: 'wrap' }}>
				{dates.map((date) => (
					<div key={date.stringDate} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<DisplayWithoutCurrentView day={date} />
						<EventActions day={date} />
					</div>
				))}
			</div>
		</div>
	);
};

export const ContentContainerWithCurrentViewMulti = () => {
	const dates = getActualMonthDays();
	return (
		<div className='container'>
			<h5>ContentContainer Multi Selector</h5>
			<div style={{ display: 'flex', flexWrap: 'wrap' }}>
				{dates.map((date) => (
					<div key={date.stringDate} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<DisplayWithMultiSelector day={date} />
						<EventActions day={date} />
					</div>
				))}
			</div>
		</div>
	);
};

export const ContentContainerWithCurrentView = () => {
	const dates = getActualMonthDays();
	return (
		<div className='container'>
			<h5>ContentContainer Selector unico duplicado: (useStore dos veces)</h5>
			<div style={{ display: 'flex', flexWrap: 'wrap' }}>
				{dates.map((date) => (
					<div key={date.stringDate} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<DisplayWithCurrentView day={date} />
						<EventActions day={date} />
					</div>
				))}
			</div>
		</div>
	);
};

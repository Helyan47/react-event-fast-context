import React from 'react';
import Provider from './Context';
import { ContentContainerWithCurrentView, ContentContainerWithCurrentViewMulti, ContentContainerWithoutCurrentView } from './components/Container';

function App() {
	return (
		<Provider>
			<div className='container'>
				<h5>App</h5>
				<ContentContainerWithoutCurrentView />
				<ContentContainerWithCurrentView />
				<ContentContainerWithCurrentViewMulti />
			</div>
		</Provider>
	);
}

export default App;

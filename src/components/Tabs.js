import '../styles/Tabs.css'

import React, { useState } from 'react';

export function TabList ({ children, html, css, js }) {
	const [activeTab, setActiveTab] = useState(0);
	const [tabs, setTabs] = useState(children.map(child => child.props.label));

	const handleClick = (index) => {
		setActiveTab(index);
	}

	return (
		<div className="tablist-container">
			<div className="tablist-header">
				{tabs.map((tab, index) => (
					<div
						key={index}
						className={index === activeTab ? "tablist-tab active" : "tablist-tab"}
						onClick={() => handleClick(index)}
					>
						{tab}
					</div>
				))}
			</div>
			<div className="tablist-content">
				{React.Children.map(children, (child, index) => (
					index === activeTab && React.cloneElement(child, { html, css, js })
				))}
			</div>
		</div>
	);
}


export function Tab({ label, children }) {
	return (
		<>
			{children}
		</>
	);
}
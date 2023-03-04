import '../styles/Tabs.css';
import React, { useState } from 'react';

import { SlIcon } from "@shoelace-style/shoelace/dist/react";
import { SlBadge } from "@shoelace-style/shoelace/dist/react";

export function TabList ({ children, html, css, js, loadingResponse }) {
	const [activeTab, setActiveTab] = useState(children[0].key);

	const handleChangeTab = (key) => {
		setActiveTab(key);
	}

	return (
		<div className="tablist-container">
			<div className="tablist-header">
				{children.map(({ key, props }) => (
					<div
						key={key}
						className={`tablist-tab ${activeTab === key ? "active" : ""}`}
						onClick={() => handleChangeTab(key)}
					>
						<SlIcon name={props.icon} label={props.label} />
						<span>{props.label}</span>
					</div>
				))}
			</div>
			{children.map(({ key, props }) => (
				<div key={key} className={`tablist-content ${activeTab === key ? "active" : ""}`}>
					<div className="tablist-content-inner">
						{React.cloneElement(props.children, { html, css, js, loadingResponse })}
					</div>
				</div>
			))}
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
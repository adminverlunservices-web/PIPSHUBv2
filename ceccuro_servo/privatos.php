<?php
declare(strict_types=1);

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
?>
(() => {
	document.addEventListener('contextmenu', (event) => event.preventDefault());
	document.addEventListener('dragstart', (event) => {
		if (event.target instanceof HTMLImageElement || event.target instanceof HTMLVideoElement) {
			event.preventDefault();
		}
	});
	document.addEventListener('keydown', (event) => {
		const key = event.key.toLowerCase();
		const blocked = (event.ctrlKey || event.metaKey) && ['s', 'u', 'p'].includes(key);
		const devTools = event.key === 'F12' || ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j', 'c'].includes(key));
		if (blocked || devTools) event.preventDefault();
	}, true);
})();

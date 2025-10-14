export default function SlipPage() {
	return (
		<div style={{ maxWidth: 800, margin: '2rem auto', background: 'white', padding: 24, border: '1px solid #000' }}>
			<h3 style={{ textAlign: 'center' }}>Clearance Form - Ekiti State University</h3>
			<p>This printable slip will mirror the PHP layout. Content to be expanded.</p>
			<div style={{ textAlign: 'center', marginTop: 16 }}>
				<button className="btn" onClick={() => window.print()}>Print</button>
			</div>
		</div>
	)
}



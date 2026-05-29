export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
    }}>
      <section style={{ maxWidth: 640 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>3PL Chamados</h1>
        <p style={{ lineHeight: 1.6 }}>
          API do portal de suporte BSC disponível. Configure a interface ou consuma as rotas em
          <code style={{ marginLeft: 6 }}>/api</code>.
        </p>
      </section>
    </main>
  )
}

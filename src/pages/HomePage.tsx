import Button from '../components/base/Button.tsx'
import Input from '../components/base/Input.tsx'
import Card from '../components/base/Card.tsx'

function HomePage() {
  return (
    <section className="page-home" aria-label="Home page">
      <h1>Component Base</h1>
      <p className="lead">Reusable building blocks ready for your next features.</p>

      <section className="component-grid" aria-label="Component examples">
        <Card title="Button" subtitle="Primary and ghost variants">
          <div className="example-row">
            <Button>Primary action</Button>
            <Button variant="ghost">Secondary</Button>
          </div>
        </Card>

        <Card title="Input" subtitle="Label, hint, and placeholder support">
          <Input
            id="email"
            label="Email"
            placeholder="you@example.com"
            hint="We'll use this to send learning updates."
          />
        </Card>

        <Card title="Card" subtitle="Content wrapper with title and body">
          <p>
            Cards keep content grouped and easy to scan, especially in dashboards and
            course lists.
          </p>
        </Card>
      </section>
    </section>
  )
}

export default HomePage

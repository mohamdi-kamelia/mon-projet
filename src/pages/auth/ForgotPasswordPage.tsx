import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

const API_URL = 'http://localhost:8081';

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);
      console.log('✅ Password reset email sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fr-container fr-mt-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-6">
          <h1>Mot de passe oublié ?</h1>
          <p className="fr-text--lead">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {error && (
            <div className="fr-alert fr-alert--error fr-mb-3w">
              <p className="fr-alert__title">Erreur</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="fr-alert fr-alert--success fr-mb-3w">
              <p className="fr-alert__title">Email envoyé !</p>
              <p>
                Si cette adresse email est enregistrée, vous recevrez un lien de réinitialisation.
                Vérifiez également vos spams.
              </p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <Input
                label="Adresse électronique"
                nativeInputProps={{
                  type: "email",
                  name: "email",
                  required: true,
                  disabled: loading,
                  autoComplete: "email",
                }}
              />

              <Button 
                type="submit" 
                className="fr-mt-3w" 
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            </form>
          )}

          <p className="fr-mt-3w">
            <Link to="/login" className="fr-link">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
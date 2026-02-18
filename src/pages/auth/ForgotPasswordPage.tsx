import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

// const API_URL = 'http://localhost:8080';
const API_URL = import.meta.env.VITE_BACKEND_URL || '';

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Lien retour */}
        <div className="mb-6">
          <Link
            to="/login"
            className="fr-link inline-flex items-center gap-2 hover:underline"
          >
            <span className="ri-arrow-left-line" aria-hidden="true"></span>
            Retour à la connexion
          </Link>
        </div>

        {/* Card DSFR */}
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header de la card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="ri-lock-password-line text-2xl text-white"></span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Mot de passe oublié ?
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Réinitialisez votre accès
                </p>
              </div>
            </div>
          </div>

          {/* Contenu de la card */}
          <div className="px-8 py-6">
            {/* Message d'information */}
            {!success && (
              <div className="mb-6">
                <Alert
                  severity="info"
                  title="Comment ça marche ?"
                  description="Entrez votre adresse email et nous vous enverrons un lien pour créer un nouveau mot de passe."
                  small
                />
              </div>
            )}

            {/* Alert d'erreur */}
            {error && (
              <div className="mb-6">
                <Alert
                  severity="error"
                  title="Erreur"
                  description={error}
                  closable
                  onClose={() => setError('')}
                />
              </div>
            )}

            {/* Alert de succès */}
            {success && (
              <div className="mb-6">
                <Alert
                  severity="success"
                  title="Email envoyé !"
                  description="Si cette adresse est enregistrée, vous recevrez un lien de réinitialisation. Pensez à vérifier vos spams."
                />
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input DSFR */}
                <Input
                  label="Adresse électronique"
                  hintText="L'adresse email de votre compte"
                  nativeInputProps={{
                    type: "email",
                    name: "email",
                    required: true,
                    disabled: loading,
                    autoComplete: "email",
                    placeholder: "nom@exemple.fr"
                  }}
                />

                {/* Submit Button DSFR */}
                <Button
                  type="submit"
                  disabled={loading}
                  iconId={loading ? undefined : "ri-mail-send-line"}
                  iconPosition="right"
                  size="large"
                  className="w-full"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>
            )}

            {/* Message après succès */}
            {success && (
              <div className="space-y-4">
                <Button
                  priority="secondary"
                  linkProps={{
                    to: "/login"
                  }}
                  iconId="ri-login-box-line"
                  iconPosition="right"
                  size="large"
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
              </div>
            )}
          </div>

          {/* Footer informatif */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <span className="ri-information-line text-blue-600 text-xl flex-shrink-0"></span>
              <p className="text-sm text-gray-600">
                <strong>Besoin d'aide ?</strong><br />
                Si vous n'avez pas accès à votre email, contactez votre administrateur.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2026 Maison des Mathématiques Virtuelle
          </p>
        </div>
      </div>

      <style>{`
        /* Animations subtiles */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bg-white {
          animation: fadeIn 0.5s ease-out;
        }

        /* Amélioration des inputs DSFR */
        .fr-input:focus {
          box-shadow: 0 0 0 2px rgba(0, 0, 145, 0.2);
        }

        /* Amélioration du bouton DSFR */
        .fr-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 145, 0.2);
        }

        .fr-btn {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}
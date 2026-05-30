export const processPayment = async (amount: number, formattedPhone: string): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Fais l'appel POST vers le point de terminaison de la passerelle de paiement
    // (Simulation of fetch for USSD PUSH API)
    const payload = {
      phoneNumber: formattedPhone, // Perfectly cleaned (e.g. +24174123456)
      amount: Math.ceil(amount), // Exact amount rounded to next integer
      description: `Paiement Commande - ${Date.now()}`
    };

    console.log("Envoi du payload USSD PUSH: ", payload);

    /*
    const response = await fetch("https://api.paymentgateway.com/ussd-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error("Paiement refusé");
    */

    // Simulated waiting for long-polling confirmation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate success
        resolve({
          success: true,
          transactionId: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        });
      }, 2500);
    });
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur de paiement" };
  }
};

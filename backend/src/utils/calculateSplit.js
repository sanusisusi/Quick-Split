// calculateSplit.js

/**
 * Equal split of bill
 */
function equalSplit(totalBill, participants) {
  if (!participants.length) return [];

  const share = totalBill / participants.length;

  return participants.map((p) => ({
    ...p,
    share: Number(share.toFixed(2))
  }));
}

/**
 * Calculate item-based split
 */
function itemSplit(participants) {

  return participants.map((participant) => {

    const total = participant.items.reduce((sum, item) => {
      return sum + item.price;
    }, 0);

    return {
      ...participant,
      share: Number(total.toFixed(2))
    };

  });
}

/**
 * Calculate bill progress
 */
function paymentProgress(participants) {

  const totalParticipants = participants.length;

  const paidParticipants = participants.filter(p => p.paid).length;

  return {
    totalParticipants,
    paidParticipants,
    percentage:
      totalParticipants === 0
        ? 0
        : Math.round((paidParticipants / totalParticipants) * 100)
  };
}

module.exports = {
  equalSplit,
  itemSplit,
  paymentProgress
};
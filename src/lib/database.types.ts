export type Session = {
  id: string;
  name: string;
  total_amount: number;
  tip: number;
  tax: number;
  created_by: string;
  created_at: string;
  status: 'active' | 'completed' | 'cancelled';
  split_type: 'equal' | 'items' | 'custom';
};

export type Participant = {
  id: string;
  session_id: string;
  name: string;
  amount_owed: number;
  paid: boolean;
  joined_at: string;
  payment_method: 'qr' | 'ussd' | 'sms';
};

export type Item = {
  id: string;
  session_id: string;
  name: string;
  price: number;
  quantity: number;
};

export type ParticipantItem = {
  id: string;
  participant_id: string;
  item_id: string;
  quantity: number;
};

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'>;
        Update: Partial<Omit<Session, 'id'>>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'joined_at'>;
        Update: Partial<Omit<Participant, 'id'>>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, 'id'>;
        Update: Partial<Omit<Item, 'id'>>;
      };
      participant_items: {
        Row: ParticipantItem;
        Insert: Omit<ParticipantItem, 'id'>;
        Update: Partial<Omit<ParticipantItem, 'id'>>;
      };
    };
  };
};

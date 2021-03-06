class CreateServices < ActiveRecord::Migration[5.0]
  def change
    create_table :services do |t|
      t.string :name, limit: 255
      t.string :alias
      t.string :description
      t.string :website
      t.string :client_id
      t.string :client_secret
      t.integer :user_id
      t.datetime :confirmed_at

      t.timestamps
    end

    add_index :services, :name,                unique: true
  end
end

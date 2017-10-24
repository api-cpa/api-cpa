module Tester
  module Requests
    class Standard < Request

      has_one :proxy,   through: :route
      has_one :service, through: :route

      validates :route, presence: true

    end
  end
end
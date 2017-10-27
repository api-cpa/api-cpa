module Tester
  module Requests
    class Template < Request

      include HasDictionaries
      has_mandatory_dictionary_attributes :title, :body

      has_many :tester_parameters_response_headers,
               inverse_of: :tester_request,
               class_name: Tester::Parameters::ResponseHeader.name,
               foreign_key: 'tester_request_id',
               dependent: :destroy

      has_many :tester_parameters_response_body_elements,
               inverse_of: :tester_request,
               class_name: Tester::Parameters::ResponseBodyElement.name,
               foreign_key: 'tester_request_id',
               dependent: :destroy

      validates :expected_response_status, presence: true

      accepts_nested_attributes_for :tester_parameters_response_headers,
                                    allow_destroy: true

      accepts_nested_attributes_for :tester_parameters_response_body_elements,
                                    allow_destroy: true

      scope :by_category, -> (category_id) { where('tester_requests.category_id IS NULL OR tester_requests.category_id = ?', category_id) }

      def template_name
        title
      end

      def template_description
        body
      end

    end
  end
end
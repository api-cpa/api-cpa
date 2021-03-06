module ContractsHelper
  def format_contract_status_for_select
    Contract::CONTRACT_STATUSES_ENUM.map do |key, _|
      ["#{I18n.t("types.contract_statuses.#{key}.title")}", key]
    end
  end
  
  def show_contract_errors(errors)
    return if errors.blank?
    "<i class=\"fa fa-fw fa-warning\"></i> #{errors.join(', ')}".html_safe
  end
end